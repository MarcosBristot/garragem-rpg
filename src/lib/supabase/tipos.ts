export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      carros: {
        Row: {
          ano: number | null;
          apelido: string | null;
          criado_em: string;
          dono_id: string;
          foto_capa: string | null;
          id: string;
          marca: string;
          modelo: string;
          publico: boolean;
        };
        ComputedFields: never;
        Insert: {
          ano?: number | null;
          apelido?: string | null;
          criado_em?: string;
          dono_id?: string;
          foto_capa?: string | null;
          id?: string;
          marca: string;
          modelo: string;
          publico?: boolean;
        };
        Update: {
          ano?: number | null;
          apelido?: string | null;
          criado_em?: string;
          dono_id?: string;
          foto_capa?: string | null;
          id?: string;
          marca?: string;
          modelo?: string;
          publico?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "carros_dono_id_fkey";
            columns: ["dono_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      fotos_registro: {
        Row: {
          altura: number;
          chave: string;
          criado_em: string;
          descricao: string | null;
          dono_id: string;
          id: string;
          largura: number;
          registro_id: string;
        };
        ComputedFields: never;
        Insert: {
          altura: number;
          chave: string;
          criado_em?: string;
          descricao?: string | null;
          dono_id?: string;
          id?: string;
          largura: number;
          registro_id: string;
        };
        Update: {
          altura?: number;
          chave?: string;
          criado_em?: string;
          descricao?: string | null;
          dono_id?: string;
          id?: string;
          largura?: number;
          registro_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fotos_registro_dono_id_fkey";
            columns: ["dono_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fotos_registro_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fotos_registro_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros_publicos";
            referencedColumns: ["id"];
          },
        ];
      };
      historico_edicoes: {
        Row: {
          antes: Json | null;
          depois: Json | null;
          dono_id: string;
          editado_em: string;
          id: number;
          operacao: string;
          registro_id: string;
          tabela: string;
        };
        ComputedFields: never;
        Insert: {
          antes?: Json | null;
          depois?: Json | null;
          dono_id: string;
          editado_em?: string;
          id?: never;
          operacao: string;
          registro_id: string;
          tabela: string;
        };
        Update: {
          antes?: Json | null;
          depois?: Json | null;
          dono_id?: string;
          editado_em?: string;
          id?: never;
          operacao?: string;
          registro_id?: string;
          tabela?: string;
        };
        Relationships: [
          {
            foreignKeyName: "historico_edicoes_dono_id_fkey";
            columns: ["dono_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historico_edicoes_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historico_edicoes_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros_publicos";
            referencedColumns: ["id"];
          },
        ];
      };
      itens_registro: {
        Row: {
          categoria: string;
          criado_em: string;
          descricao: string;
          espaco: Database["public"]["Enums"]["espaco_equipamento"] | null;
          id: string;
          quantidade: number;
          registro_id: string;
          valor_centavos: number | null;
        };
        ComputedFields: never;
        Insert: {
          categoria: string;
          criado_em?: string;
          descricao: string;
          espaco?: Database["public"]["Enums"]["espaco_equipamento"] | null;
          id?: string;
          quantidade?: number;
          registro_id: string;
          valor_centavos?: number | null;
        };
        Update: {
          categoria?: string;
          criado_em?: string;
          descricao?: string;
          espaco?: Database["public"]["Enums"]["espaco_equipamento"] | null;
          id?: string;
          quantidade?: number;
          registro_id?: string;
          valor_centavos?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "itens_registro_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "itens_registro_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros_publicos";
            referencedColumns: ["id"];
          },
        ];
      };
      perfis: {
        Row: {
          cidade: string | null;
          criado_em: string;
          id: string;
          nome_exibicao: string | null;
          nome_usuario: string;
          termos_aceitos_em: string | null;
          versao_termos: string | null;
        };
        ComputedFields: never;
        Insert: {
          cidade?: string | null;
          criado_em?: string;
          id: string;
          nome_exibicao?: string | null;
          nome_usuario: string;
          termos_aceitos_em?: string | null;
          versao_termos?: string | null;
        };
        Update: {
          cidade?: string | null;
          criado_em?: string;
          id?: string;
          nome_exibicao?: string | null;
          nome_usuario?: string;
          termos_aceitos_em?: string | null;
          versao_termos?: string | null;
        };
        Relationships: [];
      };
      registros: {
        Row: {
          atualizado_em: string;
          carro_id: string;
          criado_em: string;
          data: string;
          dono_id: string;
          id: string;
          km: number | null;
          notas: string | null;
          tipo: Database["public"]["Enums"]["tipo_registro"];
          titulo: string;
          visibilidade: Database["public"]["Enums"]["visibilidade"];
        };
        ComputedFields: never;
        Insert: {
          atualizado_em?: string;
          carro_id: string;
          criado_em?: string;
          data: string;
          dono_id?: string;
          id?: string;
          km?: number | null;
          notas?: string | null;
          tipo: Database["public"]["Enums"]["tipo_registro"];
          titulo: string;
          visibilidade?: Database["public"]["Enums"]["visibilidade"];
        };
        Update: {
          atualizado_em?: string;
          carro_id?: string;
          criado_em?: string;
          data?: string;
          dono_id?: string;
          id?: string;
          km?: number | null;
          notas?: string | null;
          tipo?: Database["public"]["Enums"]["tipo_registro"];
          titulo?: string;
          visibilidade?: Database["public"]["Enums"]["visibilidade"];
        };
        Relationships: [
          {
            foreignKeyName: "registros_carro_id_dono_id_fkey";
            columns: ["carro_id", "dono_id"];
            isOneToOne: false;
            referencedRelation: "carros";
            referencedColumns: ["id", "dono_id"];
          },
        ];
      };
    };
    Views: {
      itens_publicos: {
        Row: {
          categoria: string;
          descricao: string;
          espaco: Database["public"]["Enums"]["espaco_equipamento"] | null;
          id: string;
          quantidade: number;
          registro_id: string;
          valor_centavos: number | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "itens_registro_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "itens_registro_registro_id_fkey";
            columns: ["registro_id"];
            isOneToOne: false;
            referencedRelation: "registros_publicos";
            referencedColumns: ["id"];
          },
        ];
      };
      registros_publicos: {
        Row: {
          carro_id: string;
          criado_em: string;
          data: string;
          dono_id: string;
          id: string;
          km: number | null;
          tipo: Database["public"]["Enums"]["tipo_registro"];
          titulo: string;
          visibilidade: Database["public"]["Enums"]["visibilidade"];
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "registros_carro_id_dono_id_fkey";
            columns: ["carro_id", "dono_id"];
            isOneToOne: false;
            referencedRelation: "carros";
            referencedColumns: ["id", "dono_id"];
          },
        ];
      };
    };
    Functions: {
      excluir_minha_conta: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      espaco_equipamento:
        "motor" | "suspensao" | "rodas" | "freios" | "estetica" | "som";
      tipo_registro: "manutencao" | "modificacao";
      visibilidade: "privado" | "publico_sem_valor" | "publico";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      espaco_equipamento: [
        "motor",
        "suspensao",
        "rodas",
        "freios",
        "estetica",
        "som",
      ],
      tipo_registro: ["manutencao", "modificacao"],
      visibilidade: ["privado", "publico_sem_valor", "publico"],
    },
  },
} as const;
