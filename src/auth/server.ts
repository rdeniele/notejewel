import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/db/prisma'

export async function createClient() {
  const cookieStore = await cookies()

  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }

  const client = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )
  return client;
}

export async function getUser(){
    try {
        const{auth} = await createClient();

        const userObject = await auth.getUser()

        if (userObject.error){
            // Handle auth errors gracefully
            if (userObject.error.message === 'Auth session missing!') {
                return null; // User is not logged in
            }
            return null
        }

        return userObject.data.user
    } catch (error) {
        // Handle any other auth-related errors
        return null;
    }
}

export async function getUserFromDatabase() {
    try {
        const user = await getUser();
        if (!user) return null;

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                planType: true,
                billingStatus: true,
            }
        });

        return dbUser;
    } catch (error) {
        console.error('Error fetching user from database:', error);
        return null;
    }
}

export async function isAdmin() {
    try {
        const dbUser = await getUserFromDatabase();
        return dbUser?.role === 'ADMIN';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

export async function requireAdmin() {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
        throw new Error('Admin access required');
    }
    return true;
}