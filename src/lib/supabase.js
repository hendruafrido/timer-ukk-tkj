import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohzyqpamvwvdirubjpdq.supabase.co';
const supabaseKey = 'sb_publishable_z78L6s3NA62GSFNcMquBwQ_wjxNWKmB';
export const supabase = createClient(supabaseUrl, supabaseKey);
