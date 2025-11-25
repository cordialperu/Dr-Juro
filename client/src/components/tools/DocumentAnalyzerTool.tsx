import { Card } from "@/components/ui/card";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";

interface DocumentAnalyzerToolProps {
  clientId: string;
}

export function DocumentAnalyzerTool({}: DocumentAnalyzerToolProps) {
  return (
    <Card className="border-none shadow-none">
      <DocumentAnalysis />
    </Card>
  );
}
