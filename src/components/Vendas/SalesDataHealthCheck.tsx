import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { useSalesIssuesSummary, useFixSalesTransactions } from '@/hooks/useSalesDataFix';
import { Skeleton } from '@/components/ui/skeleton';

export function SalesDataHealthCheck() {
  const { data: issues, isLoading, refetch } = useSalesIssuesSummary();
  const fixMutation = useFixSalesTransactions();

  const hasIssues = issues?.some(issue => issue.count_issues > 0);

  const handleFix = () => {
    fixMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Diagnóstico de Dados
          </CardTitle>
          <CardDescription>
            Verificando consistência das transações financeiras...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Diagnóstico de Dados
          {!hasIssues && <CheckCircle className="h-4 w-4 text-success" />}
          {hasIssues && <AlertTriangle className="h-4 w-4 text-warning" />}
        </CardTitle>
        <CardDescription>
          Verificação da consistência entre vendas e transações financeiras
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {issues?.map((issue) => (
          <div key={issue.issue_type} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">{issue.description}</p>
            </div>
            <Badge variant={issue.count_issues > 0 ? "destructive" : "secondary"}>
              {issue.count_issues} {issue.count_issues === 1 ? 'problema' : 'problemas'}
            </Badge>
          </div>
        )) || []}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar Novamente
          </Button>

          {hasIssues && (
            <Button
              onClick={handleFix}
              disabled={fixMutation.isPending}
              size="sm"
            >
              {fixMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Corrigir Problemas
                </>
              )}
            </Button>
          )}
        </div>

        {!hasIssues && (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-sm">Todos os dados estão consistentes!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}