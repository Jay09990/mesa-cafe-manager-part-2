// Public and admin menu data shapes shared by menu feature components.
export type DietaryType = "veg" | "non_veg" | "egg";

export type MenuItemInput = {
  name: string;
  description?: string;
  price: number;
  category: string;
  dietaryType: DietaryType;
  imageUrl?: string | null;
  available?: boolean;
  sortOrder?: number;
  isFeatured?: boolean;
};
