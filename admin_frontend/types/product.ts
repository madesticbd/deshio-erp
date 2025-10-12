export interface Product {
  id: number | string;
  name: string;
  attributes: {
    mainImage?: string;
    Image?: string | string[];
    Colour?: string;
    [key: string]: any;
  };
  variations?: {
    id: string | number;  
    attributes: Record<string, any>;
  }[];
}