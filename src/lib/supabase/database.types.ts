export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          meta: Json | null
          org_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          meta?: Json | null
          org_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          meta?: Json | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string | null
          org_id: string
          phone: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          org_id: string
          phone?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          org_id?: string
          phone?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      amenities: {
        Row: {
          category: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          agreement_date: string | null
          agreement_value: number
          booked_at: string | null
          booking_amount: number | null
          broker_id: string | null
          buyer_email: string | null
          buyer_name: string
          buyer_pan: string | null
          buyer_phone: string
          co_applicant_name: string | null
          created_at: string | null
          flat_id: string
          id: string
          lead_id: string | null
          notes: string | null
          org_id: string
          project_id: string
          registration_date: string | null
          status: string | null
        }
        Insert: {
          agreement_date?: string | null
          agreement_value: number
          booked_at?: string | null
          booking_amount?: number | null
          broker_id?: string | null
          buyer_email?: string | null
          buyer_name: string
          buyer_pan?: string | null
          buyer_phone: string
          co_applicant_name?: string | null
          created_at?: string | null
          flat_id: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id: string
          project_id: string
          registration_date?: string | null
          status?: string | null
        }
        Update: {
          agreement_date?: string | null
          agreement_value?: number
          booked_at?: string | null
          booking_amount?: number | null
          broker_id?: string | null
          buyer_email?: string | null
          buyer_name?: string
          buyer_pan?: string | null
          buyer_phone?: string
          co_applicant_name?: string | null
          created_at?: string | null
          flat_id?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          org_id?: string
          project_id?: string
          registration_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          flat_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flat_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flat_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          audience: string
          delivered_count: number | null
          id: string
          message: string
          org_id: string
          project_id: string | null
          read_count: number | null
          replied_count: number | null
          scheduled_for: string | null
          sent_at: string
          sent_count: number
          template_used: string | null
        }
        Insert: {
          audience: string
          delivered_count?: number | null
          id?: string
          message: string
          org_id: string
          project_id?: string | null
          read_count?: number | null
          replied_count?: number | null
          scheduled_for?: string | null
          sent_at?: string
          sent_count?: number
          template_used?: string | null
        }
        Update: {
          audience?: string
          delivered_count?: number | null
          id?: string
          message?: string
          org_id?: string
          project_id?: string | null
          read_count?: number | null
          replied_count?: number | null
          scheduled_for?: string | null
          sent_at?: string
          sent_count?: number
          template_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcasts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_assignments: {
        Row: {
          assigned_at: string
          broker_id: string
          commission_earned: number | null
          flat_id: string | null
          id: string
          lead_id: string
          status: string | null
        }
        Insert: {
          assigned_at?: string
          broker_id: string
          commission_earned?: number | null
          flat_id?: string | null
          id?: string
          lead_id: string
          status?: string | null
        }
        Update: {
          assigned_at?: string
          broker_id?: string
          commission_earned?: number | null
          flat_id?: string | null
          id?: string
          lead_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_assignments_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_assignments_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_links: {
        Row: {
          broker_id: string
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          project_id: string
          qr_url: string | null
        }
        Insert: {
          broker_id: string
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          qr_url?: string | null
        }
        Update: {
          broker_id?: string
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          qr_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_links_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          bio: string | null
          commission_pct: number | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          phone: string
          photo_url: string | null
          premium_expires_at: string | null
          premium_started_at: string | null
          rera_id: string | null
          slug: string | null
          tier: string | null
          total_clicks: number | null
          total_commission: number | null
          total_conversions: number | null
          total_sales: number | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          commission_pct?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          phone: string
          photo_url?: string | null
          premium_expires_at?: string | null
          premium_started_at?: string | null
          rera_id?: string | null
          slug?: string | null
          tier?: string | null
          total_clicks?: number | null
          total_commission?: number | null
          total_conversions?: number | null
          total_sales?: number | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          commission_pct?: number | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          phone?: string
          photo_url?: string | null
          premium_expires_at?: string | null
          premium_started_at?: string | null
          rera_id?: string | null
          slug?: string | null
          tier?: string | null
          total_clicks?: number | null
          total_commission?: number | null
          total_conversions?: number | null
          total_sales?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_partners: {
        Row: {
          city: string | null
          commission_pct: number | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          firm_name: string
          id: string
          is_active: boolean | null
          org_id: string
          phone: string | null
          rera_id: string | null
          total_sales: number | null
        }
        Insert: {
          city?: string | null
          commission_pct?: number | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          firm_name: string
          id?: string
          is_active?: boolean | null
          org_id: string
          phone?: string | null
          rera_id?: string | null
          total_sales?: number | null
        }
        Update: {
          city?: string | null
          commission_pct?: number | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          firm_name?: string
          id?: string
          is_active?: boolean | null
          org_id?: string
          phone?: string | null
          rera_id?: string | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_partners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          id: string
          intent: string | null
          lead_captured: boolean | null
          lead_id: string | null
          messages: Json
          org_id: string
          project_id: string
          session_id: string
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          intent?: string | null
          lead_captured?: boolean | null
          lead_id?: string | null
          messages?: Json
          org_id: string
          project_id: string
          session_id: string
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          intent?: string | null
          lead_captured?: boolean | null
          lead_id?: string | null
          messages?: Json
          org_id?: string
          project_id?: string
          session_id?: string
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          aadhar_last4: string | null
          address: string | null
          annual_income: number | null
          booking_id: string
          co_applicant_name: string | null
          co_applicant_phone: string | null
          created_at: string | null
          email: string | null
          id: string
          kyc_complete: boolean | null
          name: string
          notes: string | null
          occupation: string | null
          org_id: string
          pan: string | null
          phone: string
        }
        Insert: {
          aadhar_last4?: string | null
          address?: string | null
          annual_income?: number | null
          booking_id: string
          co_applicant_name?: string | null
          co_applicant_phone?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kyc_complete?: boolean | null
          name: string
          notes?: string | null
          occupation?: string | null
          org_id: string
          pan?: string | null
          phone: string
        }
        Update: {
          aadhar_last4?: string | null
          address?: string | null
          annual_income?: number | null
          booking_id?: string
          co_applicant_name?: string | null
          co_applicant_phone?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kyc_complete?: boolean | null
          name?: string
          notes?: string | null
          occupation?: string | null
          org_id?: string
          pan?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_milestones: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          photo_urls: string[] | null
          project_id: string
          sort_order: number | null
          target_date: string | null
          title: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          photo_urls?: string[] | null
          project_id: string
          sort_order?: number | null
          target_date?: string | null
          title: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          photo_urls?: string[] | null
          project_id?: string
          sort_order?: number | null
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "construction_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      flat_view_events: {
        Row: {
          flat_id: string
          id: string
          project_id: string
          session_id: string | null
          viewed_at: string | null
        }
        Insert: {
          flat_id: string
          id?: string
          project_id: string
          session_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          flat_id?: string
          id?: string
          project_id?: string
          session_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flat_view_events_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flat_view_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      flats: {
        Row: {
          balcony_count: number | null
          bathrooms: number | null
          buyer_name: string | null
          carpet_area_sqft: number
          created_at: string
          drone_view_url: string | null
          enquiry_count: number | null
          facing: string | null
          flat_number: string
          flat_type: Database["public"]["Enums"]["flat_type"]
          floor: number
          floor_plan_url: string | null
          id: string
          is_corner: boolean | null
          is_park_facing: boolean | null
          is_pool_facing: boolean | null
          last_status_change: string | null
          parking_count: number | null
          position_on_floor: number | null
          price_per_sqft: number | null
          project_id: string
          status: Database["public"]["Enums"]["flat_status"]
          super_area_sqft: number | null
          total_price: number
          tower: string
          tower_id: string | null
          unit_block: string | null
          view_360_url: string | null
          view_score: number | null
          wing: string | null
        }
        Insert: {
          balcony_count?: number | null
          bathrooms?: number | null
          buyer_name?: string | null
          carpet_area_sqft: number
          created_at?: string
          drone_view_url?: string | null
          enquiry_count?: number | null
          facing?: string | null
          flat_number: string
          flat_type: Database["public"]["Enums"]["flat_type"]
          floor: number
          floor_plan_url?: string | null
          id?: string
          is_corner?: boolean | null
          is_park_facing?: boolean | null
          is_pool_facing?: boolean | null
          last_status_change?: string | null
          parking_count?: number | null
          position_on_floor?: number | null
          price_per_sqft?: number | null
          project_id: string
          status?: Database["public"]["Enums"]["flat_status"]
          super_area_sqft?: number | null
          total_price: number
          tower: string
          tower_id?: string | null
          unit_block?: string | null
          view_360_url?: string | null
          view_score?: number | null
          wing?: string | null
        }
        Update: {
          balcony_count?: number | null
          bathrooms?: number | null
          buyer_name?: string | null
          carpet_area_sqft?: number
          created_at?: string
          drone_view_url?: string | null
          enquiry_count?: number | null
          facing?: string | null
          flat_number?: string
          flat_type?: Database["public"]["Enums"]["flat_type"]
          floor?: number
          floor_plan_url?: string | null
          id?: string
          is_corner?: boolean | null
          is_park_facing?: boolean | null
          is_pool_facing?: boolean | null
          last_status_change?: string | null
          parking_count?: number | null
          position_on_floor?: number | null
          price_per_sqft?: number | null
          project_id?: string
          status?: Database["public"]["Enums"]["flat_status"]
          super_area_sqft?: number | null
          total_price?: number
          tower?: string
          tower_id?: string | null
          unit_block?: string | null
          view_360_url?: string | null
          view_score?: number | null
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flats_tower_id_fkey"
            columns: ["tower_id"]
            isOneToOne: false
            referencedRelation: "towers"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          email: string | null
          id: string
          name: string
          next_followup_at: string | null
          note: string | null
          org_id: string
          phone: string
          preferred_bhk: string[] | null
          preferred_floor_max: number | null
          preferred_floor_min: number | null
          project_id: string
          score: string | null
          source: string
          stage: string | null
          status: string
          viewing_flat_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          next_followup_at?: string | null
          note?: string | null
          org_id: string
          phone: string
          preferred_bhk?: string[] | null
          preferred_floor_max?: number | null
          preferred_floor_min?: number | null
          project_id: string
          score?: string | null
          source?: string
          stage?: string | null
          status?: string
          viewing_flat_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          next_followup_at?: string | null
          note?: string | null
          org_id?: string
          phone?: string
          preferred_bhk?: string[] | null
          preferred_floor_max?: number | null
          preferred_floor_min?: number | null
          project_id?: string
          score?: string | null
          source?: string
          stage?: string | null
          status?: string
          viewing_flat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_viewing_flat_id_fkey"
            columns: ["viewing_flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      org_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_flats: number | null
          max_leads_per_month: number | null
          max_projects: number | null
          monthly_amount: number | null
          org_id: string
          plan: string
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_flats?: number | null
          max_leads_per_month?: number | null
          max_projects?: number | null
          monthly_amount?: number | null
          org_id: string
          plan?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_flats?: number | null
          max_leads_per_month?: number | null
          max_projects?: number | null
          monthly_amount?: number | null
          org_id?: string
          plan?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_colors: Json | null
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          tagline: string | null
          whatsapp_config: Json | null
        }
        Insert: {
          brand_colors?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          tagline?: string | null
          whatsapp_config?: Json | null
        }
        Update: {
          brand_colors?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          tagline?: string | null
          whatsapp_config?: Json | null
        }
        Relationships: []
      }
      payment_schedule: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          due_date: string | null
          id: string
          is_paid: boolean | null
          milestone_label: string
          org_id: string
          paid_at: string | null
          payment_mode: string | null
          percentage: number | null
          receipt_id: string | null
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          milestone_label: string
          org_id: string
          paid_at?: string | null
          payment_mode?: string | null
          percentage?: number | null
          receipt_id?: string | null
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_paid?: boolean | null
          milestone_label?: string
          org_id?: string
          paid_at?: string | null
          payment_mode?: string | null
          percentage?: number | null
          receipt_id?: string | null
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          buyer_name: string
          buyer_phone: string
          created_at: string
          date: string
          flat_id: string | null
          id: string
          org_id: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          project_id: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          buyer_name: string
          buyer_phone: string
          created_at?: string
          date: string
          flat_id?: string | null
          id?: string
          org_id: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          project_id: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          date?: string
          flat_id?: string | null
          id?: string
          org_id?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          project_id?: string
          receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_amenities: {
        Row: {
          amenity_id: string
          project_id: string
        }
        Insert: {
          amenity_id: string
          project_id: string
        }
        Update: {
          amenity_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_amenities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_media: {
        Row: {
          id: string
          is_featured: boolean | null
          org_id: string
          project_id: string
          sort_order: number | null
          title: string | null
          type: string
          uploaded_at: string | null
          url: string
        }
        Insert: {
          id?: string
          is_featured?: boolean | null
          org_id: string
          project_id: string
          sort_order?: number | null
          title?: string | null
          type: string
          uploaded_at?: string | null
          url: string
        }
        Update: {
          id?: string
          is_featured?: boolean | null
          org_id?: string
          project_id?: string
          sort_order?: number | null
          title?: string | null
          type?: string
          uploaded_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          body: string
          created_at: string
          id: string
          org_id: string
          project_id: string
          sent_by: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          org_id: string
          project_id: string
          sent_by?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          org_id?: string
          project_id?: string
          sent_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          acreage: number | null
          bank_approvals: Json | null
          brochure_url: string | null
          chatbot_data: Json | null
          city: string | null
          construction_percentage: number | null
          construction_stage: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          drone_video_url: string | null
          flats_per_floor: number | null
          id: string
          lat: number | null
          lng: number | null
          locality_insights: Json | null
          locality_insights_updated_at: string | null
          location: string
          model_3d_url: string | null
          name: string
          org_id: string
          payment_plan: Json | null
          possession_date: string | null
          price_max: number | null
          price_starting: number | null
          rera_number: string | null
          roi_data: Json | null
          status: Database["public"]["Enums"]["project_status"]
          total_floors: number | null
          total_towers: number | null
          unit_mix: Json | null
        }
        Insert: {
          acreage?: number | null
          bank_approvals?: Json | null
          brochure_url?: string | null
          chatbot_data?: Json | null
          city?: string | null
          construction_percentage?: number | null
          construction_stage?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drone_video_url?: string | null
          flats_per_floor?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          locality_insights?: Json | null
          locality_insights_updated_at?: string | null
          location: string
          model_3d_url?: string | null
          name: string
          org_id: string
          payment_plan?: Json | null
          possession_date?: string | null
          price_max?: number | null
          price_starting?: number | null
          rera_number?: string | null
          roi_data?: Json | null
          status?: Database["public"]["Enums"]["project_status"]
          total_floors?: number | null
          total_towers?: number | null
          unit_mix?: Json | null
        }
        Update: {
          acreage?: number | null
          bank_approvals?: Json | null
          brochure_url?: string | null
          chatbot_data?: Json | null
          city?: string | null
          construction_percentage?: number | null
          construction_stage?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drone_video_url?: string | null
          flats_per_floor?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          locality_insights?: Json | null
          locality_insights_updated_at?: string | null
          location?: string
          model_3d_url?: string | null
          name?: string
          org_id?: string
          payment_plan?: Json | null
          possession_date?: string | null
          price_max?: number | null
          price_starting?: number | null
          rera_number?: string | null
          roi_data?: Json | null
          status?: Database["public"]["Enums"]["project_status"]
          total_floors?: number | null
          total_towers?: number | null
          unit_mix?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          org_id: string | null
          p256dh: string
          project_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          org_id?: string | null
          p256dh: string
          project_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          org_id?: string | null
          p256dh?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          booking_id: string | null
          buyer_name: string
          buyer_phone: string | null
          flat_details: Json | null
          generated_at: string | null
          id: string
          org_id: string
          payment_date: string
          payment_mode: string | null
          payment_schedule_id: string | null
          pdf_url: string | null
          receipt_number: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          buyer_name: string
          buyer_phone?: string | null
          flat_details?: Json | null
          generated_at?: string | null
          id?: string
          org_id: string
          payment_date: string
          payment_mode?: string | null
          payment_schedule_id?: string | null
          pdf_url?: string | null
          receipt_number: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          flat_details?: Json | null
          generated_at?: string | null
          id?: string
          org_id?: string
          payment_date?: string
          payment_mode?: string | null
          payment_schedule_id?: string | null
          pdf_url?: string | null
          receipt_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_enquiries: {
        Row: {
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string
          created_at: string | null
          id: string
          listing_id: string
          message: string | null
          org_id: string
          status: string | null
        }
        Insert: {
          buyer_email?: string | null
          buyer_name: string
          buyer_phone: string
          created_at?: string | null
          id?: string
          listing_id: string
          message?: string | null
          org_id: string
          status?: string | null
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          org_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resale_enquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "resale_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_enquiries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_listings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          asking_price: number
          created_at: string | null
          description: string | null
          flat_id: string | null
          id: string
          org_id: string
          original_booking_price: number | null
          photos: string[] | null
          possession_status: string | null
          project_id: string
          seller_name: string
          seller_phone: string
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asking_price: number
          created_at?: string | null
          description?: string | null
          flat_id?: string | null
          id?: string
          org_id: string
          original_booking_price?: number | null
          photos?: string[] | null
          possession_status?: string | null
          project_id: string
          seller_name: string
          seller_phone: string
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asking_price?: number
          created_at?: string | null
          description?: string | null
          flat_id?: string | null
          id?: string
          org_id?: string
          original_booking_price?: number | null
          photos?: string[] | null
          possession_status?: string | null
          project_id?: string
          seller_name?: string
          seller_phone?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resale_listings_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_listings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_listings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_url: string | null
          org_id: string
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          org_id: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          org_id?: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "org_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      towers: {
        Row: {
          created_at: string
          flats_per_floor: number
          id: string
          name: string
          project_id: string
          total_floors: number
        }
        Insert: {
          created_at?: string
          flats_per_floor?: number
          id?: string
          name: string
          project_id: string
          total_floors?: number
        }
        Update: {
          created_at?: string
          flats_per_floor?: number
          id?: string
          name?: string
          project_id?: string
          total_floors?: number
        }
        Relationships: [
          {
            foreignKeyName: "towers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          org_id: string | null
          phone: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          org_id?: string | null
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          org_id?: string | null
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          interakt_message_id: string | null
          org_id: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          status: string | null
          template_name: string
          template_params: Json | null
          to_phone: string
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          interakt_message_id?: string | null
          org_id: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: string | null
          template_name: string
          template_params?: Json | null
          to_phone: string
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          interakt_message_id?: string | null
          org_id?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string
          template_params?: Json | null
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_or_developer: { Args: never; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      org_role: { Args: { org: string }; Returns: string }
    }
    Enums: {
      flat_status: "available" | "sold" | "reserved" | "held" | "discussion"
      flat_type: "studio" | "1bhk" | "2bhk" | "3bhk" | "4bhk" | "penthouse"
      payment_mode: "cash" | "cheque" | "upi" | "bank_transfer"
      project_status: "active" | "upcoming" | "completed"
      user_role: "developer" | "admin" | "buyer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      flat_status: ["available", "sold", "reserved", "held", "discussion"],
      flat_type: ["studio", "1bhk", "2bhk", "3bhk", "4bhk", "penthouse"],
      payment_mode: ["cash", "cheque", "upi", "bank_transfer"],
      project_status: ["active", "upcoming", "completed"],
      user_role: ["developer", "admin", "buyer"],
    },
  },
} as const
