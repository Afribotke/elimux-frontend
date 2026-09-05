import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();

    const messageId = body.get('id') as string;
    const status = body.get('status') as string; // Sent, Delivered, Failed
    const phoneNumber = body.get('phoneNumber') as string;
    const networkCode = body.get('networkCode') as string;
    const failureReason = body.get('failureReason') as string;
    const retryCount = body.get('retryCount') as string;

    // Find the message by provider_msg_id
    const { data: messages, error: findError } = await supabase
      .from('crm_messages')
      .select('id')
      .eq('provider_msg_id', messageId)
      .eq('channel', 'sms')
      .limit(1);

    if (findError || !messages || messages.length === 0) {
      console.warn('AT webhook: message not found for ID', messageId);
      return NextResponse.json({ received: true });
    }

    const messageRow = messages[0];

    // Map Africa's Talking status to our status
    let ourStatus = 'sent';
    const timestamp = new Date().toISOString();

    switch (status?.toLowerCase()) {
      case 'delivered':
        ourStatus = 'delivered';
        await supabase
          .from('crm_messages')
          .update({ status: 'delivered', delivered_at: timestamp })
          .eq('id', messageRow.id);
        break;
      case 'failed':
      case 'rejected':
        ourStatus = 'failed';
        await supabase
          .from('crm_messages')
          .update({
            status: 'failed',
            failed_at: timestamp,
            fail_reason: failureReason || `Network: ${networkCode}`
          })
          .eq('id', messageRow.id);
        break;
      case 'sent':
        // Already recorded at send time, no update needed
        break;
      default:
        console.log('AT webhook: unhandled status', status);
    }

    return NextResponse.json({ received: true, status: ourStatus });
  } catch (error) {
    console.error('AT webhook error:', error);
    return NextResponse.json({ received: true, error: 'processing failed' }, { status: 200 });
  }
}
