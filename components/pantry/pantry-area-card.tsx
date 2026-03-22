"use client";

import { Edit, Trash2, Plus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { PantryAreaWithItems } from "@/server/pantry.actions";
import { usePantryAreasDelete, usePantryItemsDelete } from "@/hooks/use-pantry";
import { PantryItem } from "@prisma/client";
import { getDaysUntilExpiry, isExpired } from "./helpers";

interface PantryAreaCardProps {
  area: PantryAreaWithItems;
  onEditArea: () => void;
  onAddItem: () => void;
  onEditItem: (item: PantryItem) => void;
}

export default function PantryAreaCard({
  area,
  onEditArea,
  onAddItem,
  onEditItem,
}: PantryAreaCardProps) {
  const deleteAreaMutation = usePantryAreasDelete();
  const deleteItemMutation = usePantryItemsDelete();

  const getExpiryBadgeVariant = (expiryDate: Date) => {
    if (isExpired(expiryDate)) return "destructive";
    const days = getDaysUntilExpiry(expiryDate);
    if (days <= 3) return "destructive";
    if (days <= 7) return "secondary";
    return "outline";
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{area.name}</CardTitle>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEditArea}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Area</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{area.name}&quot;? This will also delete
                    all items in this area. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAreaMutation.mutate(area.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Badge variant="outline">{area.pantryItems.length} items</Badge>
          <Button variant="outline" size="sm" onClick={onAddItem}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {area.pantryItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No items in this area</p>
          </div>
        ) : (
          <div className="space-y-2">
            {area.pantryItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{item.name}</span>
                    <Badge variant={getExpiryBadgeVariant(item.expiresAt)} className="text-xs">
                      {isExpired(item.expiresAt)
                        ? "Expired"
                        : `${getDaysUntilExpiry(item.expiresAt)}d left`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Expires: {item.expiresAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Made: {item.producedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditItem(item)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          {`Are you sure you want to delete '${item.name}'? This action cannot be undone.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                        >
                          Delete
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
