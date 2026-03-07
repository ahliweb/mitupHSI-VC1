import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LocalizedInput from '@/components/ui/LocalizedInput';

function FinanceEditor({ data = {}, updateField }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Financial Transparency</CardTitle>
        <CardDescription>BOS, APBD, and Committee reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="BOS Report Content"
          type="richtext"
          value={data.bos?.content}
          onChange={(value) => updateField('bos', 'content', value)}
        />
      </CardContent>
    </Card>
  );
}

export default FinanceEditor;
