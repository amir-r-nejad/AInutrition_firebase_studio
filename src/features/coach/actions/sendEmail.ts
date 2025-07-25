'use server';

import { createClient } from '@/lib/supabase/server';

export async function sendWelcomeEmail() {
  const supabase = await createClient();

  const { error, data } = await supabase.functions.invoke('send-email', {
    body: {
      to: 'yunesmaghsoudie@gmail.com',
      subject: 'Welcome',
      html: `
      <h1>Hello user</h1>
      <p>Welcome to our platform. We're excited to have you!</p>
      <p>Get started by exploring our features...</p>
      `,
    },
  });

  console.log('ERROR ⛔⛔', error);

  console.log(data);
}
