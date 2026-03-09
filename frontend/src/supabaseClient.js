import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://roayuxdhwoabiystnpvs.supabase.co'
const supabaseAnonKey = 'sb_publishable_8hXPdbhNEQFYs8R2QlvFvQ_jWAmjTOv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)