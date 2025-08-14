// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl: string = "https://fbquhjjzyqcncliblyyy.supabase.co";
const supabaseKey: string =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicXVoamp6eXFjbmNsaWJseXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzI0MjMsImV4cCI6MjA1OTk0ODQyM30.zF3sBIhcdrm3-hvj1yUZffmxq4k-QWL_JpxUbMWB1cU";
export const supabase = createClient(supabaseUrl, supabaseKey);
