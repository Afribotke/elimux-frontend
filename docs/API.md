# ElimuX API Documentation

## Authentication
All protected endpoints require a Bearer token in the Authorization header.

```
Authorization: Bearer <supabase_jwt_token>
```

## Endpoints

### Programs
- `GET /api/programs` - List all programs
- `GET /api/programs/:id` - Get program details
- `POST /api/programs` - Create program (admin)
- `PATCH /api/programs/:id` - Update program (admin)
- `DELETE /api/programs/:id` - Delete program (admin)

### Search
- `POST /api/search/semantic` - Semantic vector search
- `POST /api/search/embed` - Generate embedding
- `GET /api/search/suggestions` - Autocomplete suggestions

### Partners
- `POST /api/partners/register` - Register as partner
- `GET /api/partners/me` - Get current partner
- `GET /api/partners/:id/stats` - Partner statistics

### Ads
- `POST /api/ads/campaigns` - Create campaign
- `GET /api/ads/campaigns` - List campaigns
- `POST /api/ads/impression` - Track impression
- `POST /api/ads/click` - Track click

### Payments
- `POST /api/payments/paystack/initialize` - Initialize Paystack payment
- `GET /api/payments/verify/:reference` - Verify payment

## Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```
