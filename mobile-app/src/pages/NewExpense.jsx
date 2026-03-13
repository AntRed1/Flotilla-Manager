// src/pages/NewExpense.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedExpenseForm from "@/components/expense/EnhancedExpenseForm";

export default function NewExpense() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/Dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/Dashboard")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Nuevo Gasto</h1>
              <p className="text-sm text-muted-foreground">
                Registra un consumo de combustible
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 pt-6">
        <Card className="p-6">
          <EnhancedExpenseForm onSuccess={handleSuccess} />
        </Card>
      </div>
    </div>
  );
}
