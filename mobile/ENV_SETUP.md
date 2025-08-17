# Environment Setup for DreamWeave Mobile

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project (or create a new one)
   - Go to Settings → API
   - Copy the following values:
     - Project URL → `EXPO_PUBLIC_SUPABASE_URL`
     - Anon/Public Key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. **Edit your .env file:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   EXPO_PUBLIC_API_URL=http://localhost:5000
   ```

4. **For production or testing on physical device:**
   - Replace `localhost` with your machine's IP address
   - Example: `EXPO_PUBLIC_API_URL=http://192.168.1.100:5000`

## Important Notes

- **EXPO_PUBLIC_ prefix is required** for environment variables in Expo
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- If you change environment variables, restart your Expo development server

## Troubleshooting

### Missing Credentials Error
If you see "Missing Supabase credentials" in the console:
1. Make sure your `.env` file exists
2. Verify the variable names match exactly (including EXPO_PUBLIC_ prefix)
3. Restart your Expo development server: `expo start -c`

### Connection Issues
If Supabase operations fail:
1. Check your internet connection
2. Verify your Supabase project is active
3. Ensure your API keys are correct
4. Check Supabase dashboard for any service issues

## Database Setup

Before using the app, make sure to:
1. Run the SQL commands in `SUPABASE_SETUP.md` in your Supabase SQL editor
2. Enable the required storage buckets
3. Configure Row Level Security (RLS) policies

## Next Steps

After setting up your environment:
1. Run `npm install` to install dependencies
2. Run `expo start` to start the development server
3. Scan the QR code with Expo Go app on your phone
4. Start recording your dreams!