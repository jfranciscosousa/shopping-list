"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_EMOJI_FALLBACK } from "@/lib/category-emojis";
import { FileText, LoaderCircle } from "lucide-react";
import { useState } from "react";

export type ShoppingListCategory = {
  id: number;
  name: string;
  emoji: string | null;
  shoppingItems: {
    id: number;
    name: string;
  }[];
};

type Props = {
  categories: ShoppingListCategory[];
};

function createEmojiImage(emoji: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");

  if (!context) return null;

  context.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(emoji, 32, 34);

  return canvas.toDataURL("image/png");
}

export default function ShoppingListPdfExport({ categories }: Props) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const itemCount = categories.reduce(
    (count, category) => count + category.shoppingItems.length,
    0,
  );

  async function exportPdf() {
    if (itemCount === 0) return;

    setIsExporting(true);

    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const addPageIfNeeded = (height: number) => {
        if (y + height <= pageHeight - margin) return;

        pdf.addPage();
        y = margin;
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text("Shopping list", margin, y);
      y += 24;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `Generated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date())} · ${itemCount} ${itemCount === 1 ? "item" : "items"}`,
        margin,
        y,
      );
      pdf.setTextColor(0);
      y += 32;

      for (const category of categories) {
        const itemLines = category.shoppingItems.flatMap(
          (item) => pdf.splitTextToSize(item.name, contentWidth - 22) as string[],
        );
        const categoryHeight = 44 + itemLines.length * 18 + 12;
        addPageIfNeeded(categoryHeight);

        const emoji = createEmojiImage(category.emoji ?? CATEGORY_EMOJI_FALLBACK);
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
        if (emoji) pdf.addImage(emoji, "PNG", margin + 8, y + 5, 16, 16);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(category.name, margin + 32, y + 18);
        y += 44;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        for (const item of category.shoppingItems) {
          const lines = pdf.splitTextToSize(item.name, contentWidth - 22) as string[];
          addPageIfNeeded(lines.length * 18);
          pdf.circle(margin + 5, y - 4, 4);
          pdf.text(lines, margin + 18, y);
          y += lines.length * 18;
        }

        y += 12;
      }

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`shopping-list-${date}.pdf`);
      toast({
        title: "PDF downloaded",
        description: "Your shopping list is ready to take with you.",
      });
    } catch {
      toast({
        title: "Couldn’t create the PDF",
        description: "Please try exporting your list again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportPdf}
      disabled={itemCount === 0 || isExporting}
      className="shrink-0 rounded-xl sm:w-36"
      title={itemCount === 0 ? "Add items before exporting a PDF" : "Export shopping list as PDF"}
    >
      {isExporting ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <FileText className="size-4" />
      )}
      <span className="hidden sm:inline">{isExporting ? "Creating PDF..." : "Export PDF"}</span>
      <span className="sr-only sm:hidden">{isExporting ? "Creating PDF" : "Export PDF"}</span>
    </Button>
  );
}
