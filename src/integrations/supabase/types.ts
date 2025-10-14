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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      brokers: {
        Row: {
          commission_rate: number | null
          contact_info: Json | null
          created_at: string | null
          id: string
          license_number: string | null
          office_address: string | null
          specialization: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          commission_rate?: number | null
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          license_number?: string | null
          office_address?: string | null
          specialization?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          commission_rate?: number | null
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          license_number?: string | null
          office_address?: string | null
          specialization?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          company_description: string | null
          company_name: string
          contact_info: Json | null
          created_at: string | null
          established_year: number | null
          id: string
          social_media: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          website: string | null
        }
        Insert: {
          company_description?: string | null
          company_name: string
          contact_info?: Json | null
          created_at?: string | null
          established_year?: number | null
          id?: string
          social_media?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string
          contact_info?: Json | null
          created_at?: string | null
          established_year?: number | null
          id?: string
          social_media?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      flat_details: {
        Row: {
          additional_details: string | null
          built_up_area: number | null
          carpet_area: number | null
          created_at: string
          flat_condition: string | null
          flat_size: number | null
          flat_type: string | null
          floor_number: number | null
          id: string
          ownership_documents: Json | null
          ownership_type: string | null
          society_member_id: string
          updated_at: string
        }
        Insert: {
          additional_details?: string | null
          built_up_area?: number | null
          carpet_area?: number | null
          created_at?: string
          flat_condition?: string | null
          flat_size?: number | null
          flat_type?: string | null
          floor_number?: number | null
          id?: string
          ownership_documents?: Json | null
          ownership_type?: string | null
          society_member_id: string
          updated_at?: string
        }
        Update: {
          additional_details?: string | null
          built_up_area?: number | null
          carpet_area?: number | null
          created_at?: string
          flat_condition?: string | null
          flat_size?: number | null
          flat_type?: string | null
          floor_number?: number | null
          id?: string
          ownership_documents?: Json | null
          ownership_type?: string | null
          society_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flat_details_society_member_id_fkey"
            columns: ["society_member_id"]
            isOneToOne: false
            referencedRelation: "society_members"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          admin_notes: string | null
          broker_id: string | null
          contact_preference: string | null
          created_at: string | null
          developer_id: string | null
          id: string
          inquiry_type: string
          message: string
          priority: string | null
          project_id: string | null
          property_id: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          broker_id?: string | null
          contact_preference?: string | null
          created_at?: string | null
          developer_id?: string | null
          id?: string
          inquiry_type: string
          message: string
          priority?: string | null
          project_id?: string | null
          property_id?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          broker_id?: string | null
          contact_preference?: string | null
          created_at?: string | null
          developer_id?: string | null
          id?: string
          inquiry_type?: string
          message?: string
          priority?: string | null
          project_id?: string | null
          property_id?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          flat_number: string
          id: string
          invited_by: string
          name: string | null
          phone: string | null
          qr_code: string | null
          society_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          flat_number: string
          id?: string
          invited_by: string
          name?: string | null
          phone?: string | null
          qr_code?: string | null
          society_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          flat_number?: string
          id?: string
          invited_by?: string
          name?: string | null
          phone?: string | null
          qr_code?: string | null
          society_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_invitations_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          business_type: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          profile_picture: string | null
          role: string
          social_media: Json | null
          status: string | null
          updated_at: string
          verification_status: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          profile_picture?: string | null
          role?: string
          social_media?: Json | null
          status?: string | null
          updated_at?: string
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_picture?: string | null
          role?: string
          social_media?: Json | null
          status?: string | null
          updated_at?: string
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          amenities: string[] | null
          available_units: number | null
          builder: string
          completion_date: string | null
          created_at: string
          description: string | null
          developer_id: string | null
          floor_plans: Json | null
          id: string
          images: string[] | null
          location: string
          name: string
          price_range: string
          project_type: string | null
          status: string
          total_units: number | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          available_units?: number | null
          builder: string
          completion_date?: string | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          floor_plans?: Json | null
          id?: string
          images?: string[] | null
          location: string
          name: string
          price_range: string
          project_type?: string | null
          status?: string
          total_units?: number | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          available_units?: number | null
          builder?: string
          completion_date?: string | null
          created_at?: string
          description?: string | null
          developer_id?: string | null
          floor_plans?: Json | null
          id?: string
          images?: string[] | null
          location?: string
          name?: string
          price_range?: string
          project_type?: string | null
          status?: string
          total_units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          amenities: string[] | null
          area: number
          available_from: string | null
          broker_id: string | null
          city: string
          country: string
          created_at: string
          description: string | null
          furnished_status: string | null
          id: string
          images: string[] | null
          lease_term: string | null
          listing_type: string | null
          location: string
          maintenance_cost: number | null
          min_lease_period: string | null
          monthly_rent: number | null
          owner_id: string
          price: number
          property_type: string
          security_deposit: number | null
          state: string
          status: string
          title: string
          updated_at: string
          videos: string[] | null
        }
        Insert: {
          amenities?: string[] | null
          area: number
          available_from?: string | null
          broker_id?: string | null
          city: string
          country?: string
          created_at?: string
          description?: string | null
          furnished_status?: string | null
          id?: string
          images?: string[] | null
          lease_term?: string | null
          listing_type?: string | null
          location: string
          maintenance_cost?: number | null
          min_lease_period?: string | null
          monthly_rent?: number | null
          owner_id: string
          price: number
          property_type: string
          security_deposit?: number | null
          state: string
          status?: string
          title: string
          updated_at?: string
          videos?: string[] | null
        }
        Update: {
          amenities?: string[] | null
          area?: number
          available_from?: string | null
          broker_id?: string | null
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          furnished_status?: string | null
          id?: string
          images?: string[] | null
          lease_term?: string | null
          listing_type?: string | null
          location?: string
          maintenance_cost?: number | null
          min_lease_period?: string | null
          monthly_rent?: number | null
          owner_id?: string
          price?: number
          property_type?: string
          security_deposit?: number | null
          state?: string
          status?: string
          title?: string
          updated_at?: string
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      property_views: {
        Row: {
          id: string
          ip_address: unknown | null
          property_id: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          property_id: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          property_id?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_views_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          attachments: string[] | null
          budget_estimate: number
          created_at: string | null
          description: string
          developer_id: string
          id: string
          requirement_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          technical_details: Json | null
          terms_conditions: string | null
          timeline: string
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          budget_estimate: number
          created_at?: string | null
          description: string
          developer_id: string
          id?: string
          requirement_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          technical_details?: Json | null
          terms_conditions?: string | null
          timeline: string
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          budget_estimate?: number
          created_at?: string | null
          description?: string
          developer_id?: string
          id?: string
          requirement_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          technical_details?: Json | null
          terms_conditions?: string | null
          timeline?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "redevelopment_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      redevelopment_requirements: {
        Row: {
          budget_range: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          requirement_type: string
          society_id: string
          special_needs: string[] | null
          status: string | null
          timeline_expectation: string | null
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          requirement_type: string
          society_id: string
          special_needs?: string[] | null
          status?: string | null
          timeline_expectation?: string | null
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          requirement_type?: string
          society_id?: string
          special_needs?: string[] | null
          status?: string | null
          timeline_expectation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redevelopment_requirements_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          budget: string
          city: string
          created_at: string
          description: string | null
          id: string
          property_type: string
          purpose: string
          user_id: string
        }
        Insert: {
          budget: string
          city: string
          created_at?: string
          description?: string | null
          id?: string
          property_type: string
          purpose: string
          user_id: string
        }
        Update: {
          budget?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          property_type?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      societies: {
        Row: {
          address: string
          amenities: string[] | null
          city: string
          condition_status: string | null
          contact_email: string | null
          contact_person_name: string | null
          contact_phone: string | null
          created_at: string
          flat_plan_documents: Json | null
          flat_variants: Json | null
          fsi: number | null
          id: string
          name: string
          number_of_blocks: number | null
          owner_id: string
          registration_date: string | null
          registration_documents: Json | null
          road_facing: string | null
          society_code: string
          society_type: string | null
          state: string
          total_area: number | null
          total_flats: number
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          city: string
          condition_status?: string | null
          contact_email?: string | null
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string
          flat_plan_documents?: Json | null
          flat_variants?: Json | null
          fsi?: number | null
          id?: string
          name: string
          number_of_blocks?: number | null
          owner_id?: string
          registration_date?: string | null
          registration_documents?: Json | null
          road_facing?: string | null
          society_code?: string
          society_type?: string | null
          state: string
          total_area?: number | null
          total_flats: number
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          city?: string
          condition_status?: string | null
          contact_email?: string | null
          contact_person_name?: string | null
          contact_phone?: string | null
          created_at?: string
          flat_plan_documents?: Json | null
          flat_variants?: Json | null
          fsi?: number | null
          id?: string
          name?: string
          number_of_blocks?: number | null
          owner_id?: string
          registration_date?: string | null
          registration_documents?: Json | null
          road_facing?: string | null
          society_code?: string
          society_type?: string | null
          state?: string
          total_area?: number | null
          total_flats?: number
          updated_at?: string
          year_built?: number | null
        }
        Relationships: []
      }
      society_members: {
        Row: {
          flat_number: string
          id: string
          joined_at: string
          ownership_proof: string | null
          society_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          flat_number: string
          id?: string
          joined_at?: string
          ownership_proof?: string | null
          society_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          flat_number?: string
          id?: string
          joined_at?: string
          ownership_proof?: string | null
          society_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "society_members_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolution_notes: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          comments: string | null
          id: string
          proposal_id: string
          society_member_id: string
          vote_type: string
          voted_at: string | null
        }
        Insert: {
          comments?: string | null
          id?: string
          proposal_id: string
          society_member_id: string
          vote_type: string
          voted_at?: string | null
        }
        Update: {
          comments?: string | null
          id?: string
          proposal_id?: string
          society_member_id?: string
          vote_type?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_society_member_id_fkey"
            columns: ["society_member_id"]
            isOneToOne: false
            referencedRelation: "society_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_society_member: {
        Args: { society_id: string }
        Returns: boolean
      }
      is_society_member_of: {
        Args: { society_id: string }
        Returns: boolean
      }
      is_society_owner: {
        Args: { society_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
