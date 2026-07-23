# GDPR Compliance Guide

## Data Controller
ElimuX is the data controller for all personal data collected through the platform.

## Lawful Basis for Processing
- **Contract:** Processing necessary for service delivery
- **Consent:** Marketing communications, cookies
- **Legitimate Interest:** Platform improvement, fraud prevention
- **Legal Obligation:** Tax records, regulatory compliance

## Data Subject Rights Implementation

### Right to Access
Endpoint: `GET /api/gdpr/export`
Returns all personal data in JSON format.

### Right to Erasure
Endpoint: `POST /api/gdpr/delete`
Anonymizes user data while preserving necessary records.

### Right to Portability
Endpoint: `GET /api/gdpr/export?format=csv`
Exports data in machine-readable format.

## Data Retention
- User accounts: Until deletion request
- Application data: 7 years (legal requirement)
- Analytics data: 2 years
- Payment records: 7 years

## Security Measures
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Row Level Security (RLS)
- Regular security audits
- Access logging

## Data Processors
- Supabase (database hosting)
- Vercel (frontend hosting)
- Paystack (payment processing)
- Anthropic (AI processing)

## Breach Notification
In case of a data breach:
1. Contain breach within 24 hours
2. Assess impact within 48 hours
3. Notify DPC within 72 hours
4. Notify affected users within 72 hours

## Contact
Data Protection Officer: privacy@elimux.ke
