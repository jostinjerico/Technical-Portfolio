"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import { RationaleBody } from "@/lib/content";

export function RationaleDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger button you can place anywhere */}
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="btn-eco text-primary-foreground
                     transition-all duration-300 hover:bg-gradient-accent
                     hover:-translate-y-[1px] hover:shadow-lg"
        >
          Rationale behind Gender and Climate
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Why EcoEquity?</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <RationaleBody />
        </div>
        {/* </ScrollArea> */}
      </DialogContent>
    </Dialog>
  );
}
