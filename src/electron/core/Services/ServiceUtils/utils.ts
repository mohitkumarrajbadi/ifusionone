
// Interfaces / Models
export interface Plugin {
    id?: number;
    plugin_id: string;
    plugin_name: string;
    plugin_description?: string;
    github_url?: string;
    npm_package_url?: string;
    plugin_logo_path?: string;
    plugin_version?: string;
    tags?: string;
    created_by?: string;
    verified_by_admin?: boolean;
    downloads?: number;
    rating?: number;
    installed_at?: string;
  }
  