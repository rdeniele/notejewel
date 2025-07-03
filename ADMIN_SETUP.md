# Admin Protection Setup Guide

This application now has admin route protection for `/admin` paths. Here's how to set it up:

## Features
- ✅ **Database-level role protection** - Users have `USER` or `ADMIN` roles
- ✅ **Middleware protection** - Routes starting with `/admin` are automatically protected
- ✅ **Server-side validation** - Admin pages check permissions on the server
- ✅ **API endpoint protection** - Admin APIs require admin privileges

## How Admin Protection Works

1. **Database Schema**: Added `UserRole` enum with `USER` and `ADMIN` values
2. **Middleware**: Checks user authentication and admin status before allowing access to `/admin/*` routes
3. **Server Components**: Admin pages use `requireAdmin()` function to validate permissions
4. **API Routes**: Protected admin APIs check admin status before processing requests

## Setting Up Your First Admin User

### Step 1: Create a user account normally
1. Sign up through the regular registration process
2. Make sure you can log in successfully

### Step 2: Bootstrap your first admin (ONE TIME ONLY)
Make a POST request to `/api/bootstrap-admin` with:

```bash
curl -X POST http://localhost:3000/api/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "adminSecret": "super-secret-bootstrap-key-2024"
  }'
```

Or use a tool like Postman:
- URL: `http://localhost:3000/api/bootstrap-admin`
- Method: POST
- Body (JSON):
```json
{
  "email": "your-email@example.com",
  "adminSecret": "super-secret-bootstrap-key-2024"
}
```

### Step 3: Remove the bootstrap endpoint (IMPORTANT!)
After creating your first admin, delete the file:
`src/app/api/bootstrap-admin/route.ts`

This prevents anyone else from using this endpoint to create unauthorized admins.

## Managing Additional Admins

Once you have your first admin user:

1. **Log in as an admin**
2. **Go to the admin panel**: `http://localhost:3000/admin`
3. **Use the admin management features** (you can extend the AdminBillingManager component to include user management)

## Protected Routes

- `/admin` - Admin dashboard (requires ADMIN role)
- `/admin/*` - All admin sub-routes (requires ADMIN role)
- `/api/admin/*` - Admin API endpoints (requires ADMIN role)

## API Endpoints

- `GET /api/check-admin?email=user@example.com` - Check if user is admin
- `POST /api/admin/manage-users` - Promote user to admin (admin only)
- `DELETE /api/admin/manage-users` - Remove admin privileges (admin only)
- `POST /api/bootstrap-admin` - Create first admin (delete after use!)

## Security Features

1. **Multiple validation layers**: Middleware + server components + API validation
2. **Database-driven roles**: Admin status stored securely in database
3. **Session-based authentication**: Uses Supabase authentication
4. **Secret-protected bootstrap**: Bootstrap endpoint requires secret key
5. **Admin-only user management**: Only existing admins can create new admins

## Environment Variables

Add to your `.env` file:
```
ADMIN_BOOTSTRAP_SECRET="your-super-secret-key-here"
```

## Troubleshooting

**Can't access admin page after login?**
- Check that your user email was properly promoted to admin
- Verify the admin check API is working: `/api/check-admin?email=youremail`
- Check browser dev tools for any console errors

**Bootstrap endpoint not working?**
- Verify the secret matches your `.env` file
- Make sure no admin users exist yet (endpoint only works for the first admin)
- Check the database connection

**Getting redirected from admin page?**
- Ensure you're logged in with the correct email
- Verify your user role in the database is set to "ADMIN"
- Check middleware logs for any errors
