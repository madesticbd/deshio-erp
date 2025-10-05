import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Category } from '@/components/CategoryCard';

const filePath = path.join(process.cwd(), 'data', 'categories.json');

export async function GET() {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const categories: Category[] = JSON.parse(data);
    return NextResponse.json(categories);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
<<<<<<< HEAD
    const { parentId, ...newCategoryData }: Omit<Category, 'id'> & { parentId?: string } = await req.json();
    const data = fs.readFileSync(filePath, 'utf-8');
    const categories: Category[] = JSON.parse(data);

    const allIds: number[] = [];
    const collectIds = (cats: Category[]) => {
      cats.forEach(c => {
        allIds.push(Number(c.id));
        if (c.subcategories) collectIds(c.subcategories);
      });
    };
    collectIds(categories);

    const nextId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;

    const categoryWithId: Category = { 
      ...newCategoryData, 
      id: String(nextId), 
      subcategories: [] 
    };

    const insertRecursive = (cats: Category[]): Category[] => {
      return cats.map(cat => {
        if (cat.id === parentId) {
          return { ...cat, subcategories: [...(cat.subcategories || []), categoryWithId] };
        }
        return { ...cat, subcategories: cat.subcategories ? insertRecursive(cat.subcategories) : [] };
      });
    };

    const newCategories = parentId ? insertRecursive(categories) : [...categories, categoryWithId];

    fs.writeFileSync(filePath, JSON.stringify(newCategories, null, 2), 'utf-8');
=======
    const newCategory: Omit<Category, 'id'> = await req.json();
    const data = fs.readFileSync(filePath, 'utf-8');
    const categories: Category[] = JSON.parse(data);
    

    const nextId =
    categories.length > 0
      ? Math.max(...categories.map(c => Number(c.id))) + 1
      : 1;
    const categoryWithId: Category = { ...newCategory, id: String(nextId) };

    categories.push(categoryWithId);

    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf-8');
>>>>>>> 82ae619dfdc4d7b96e1259ff74d4c55c28bee72a

    return NextResponse.json(categoryWithId, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
<<<<<<< HEAD
    const body = await req.json();
    const { moveToParentId, ...updatedCategory }: Category & { moveToParentId?: string | null } = body;
    
    const data = fs.readFileSync(filePath, 'utf-8');
    let categories: Category[] = JSON.parse(data);

    // If moveToParentId is provided, we're moving the category
    if (moveToParentId !== undefined) {
      // First, remove the category from its current location
      const deleteRecursive = (cats: Category[]): Category[] => {
        return cats
          .filter(cat => cat.id !== updatedCategory.id)
          .map(cat => ({
            ...cat,
            subcategories: cat.subcategories ? deleteRecursive(cat.subcategories) : undefined,
          }));
      };
      
      categories = deleteRecursive(categories);

      // Then add it to the new location
      if (moveToParentId) {
        // Add as subcategory
        const addToParent = (cats: Category[]): Category[] => {
          return cats.map(cat => {
            if (cat.id === moveToParentId) {
              return { 
                ...cat, 
                subcategories: [...(cat.subcategories || []), updatedCategory] 
              };
            }
            return { 
              ...cat, 
              subcategories: cat.subcategories ? addToParent(cat.subcategories) : [] 
            };
          });
        };
        categories = addToParent(categories);
      } else {
        // Add to root level
        categories = [...categories, updatedCategory];
      }
    } else {
      // Regular update (no move)
      const updateRecursive = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.id === updatedCategory.id) return updatedCategory;
          if (cat.subcategories) {
            return { ...cat, subcategories: updateRecursive(cat.subcategories) };
          }
          return cat;
        });
      };

      categories = updateRecursive(categories);
    }

    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf-8');
=======
    const updatedCategory: Category = await req.json();
    const data = fs.readFileSync(filePath, 'utf-8');
    const categories: Category[] = JSON.parse(data);

    const updateRecursive = (cats: Category[]): Category[] => {
      return cats.map(cat => {
        if (cat.id === updatedCategory.id) return updatedCategory;
        if (cat.subcategories) return { ...cat, subcategories: updateRecursive(cat.subcategories) };
        return cat;
      });
    };

    const newCategories = updateRecursive(categories);

    fs.writeFileSync(filePath, JSON.stringify(newCategories, null, 2), 'utf-8');
>>>>>>> 82ae619dfdc4d7b96e1259ff74d4c55c28bee72a

    return NextResponse.json(updatedCategory);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'No ID provided' }, { status: 400 });

    const data = fs.readFileSync(filePath, 'utf-8');
    const categories: Category[] = JSON.parse(data);

    const deleteRecursive = (cats: Category[]): Category[] => {
      return cats
        .filter(cat => cat.id !== id)
        .map(cat => ({
          ...cat,
          subcategories: cat.subcategories ? deleteRecursive(cat.subcategories) : undefined,
        }));
    };

    const newCategories = deleteRecursive(categories);

    fs.writeFileSync(filePath, JSON.stringify(newCategories, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 82ae619dfdc4d7b96e1259ff74d4c55c28bee72a
