import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Clock, Headphones, Target } from "lucide-react";

interface PatientData {
  name: string;
  age: number | string;
  gender: string;
  testDate: string;
  testDuration: string;
  vrDevice: string;
  totalScore: number;
  maxScore: number;
}

interface PatientInfoCardProps {
  patient: PatientData;
}

export const PatientInfoCard = ({ patient }: PatientInfoCardProps) => {
  const scorePercentage = (patient.totalScore / patient.maxScore) * 100;
  
  const getScoreStatus = (percentage: number) => {
    if (percentage >= 80) return { status: "正常", color: "bg-success text-white" };
    if (percentage >= 60) return { status: "輕度認知障礙", color: "bg-warning text-white" };
    return { status: "需要關注", color: "bg-destructive text-white" };
  };

  const scoreStatus = getScoreStatus(scorePercentage);

  return (
    <Card className="shadow-medical border-0 bg-gradient-to-r from-card to-card/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <User className="h-5 w-5" />
          患者基本資訊
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">姓名</span>
            <span className="font-semibold text-foreground">{patient.name}</span>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground">年齡/性別</span>
            <span className="font-semibold text-foreground">{patient.age}歲 {patient.gender}</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              測驗日期
            </span>
            <span className="font-semibold text-foreground">{patient.testDate}</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              測驗時間
            </span>
            <span className="font-semibold text-foreground">{patient.testDuration}</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Headphones className="h-3 w-3" />
              VR設備
            </span>
            <span className="font-semibold text-foreground">{patient.vrDevice}</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              總分
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-foreground">
                {patient.totalScore}/{patient.maxScore}
              </span>
              <Badge className={scoreStatus.color}>
                {scoreStatus.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};