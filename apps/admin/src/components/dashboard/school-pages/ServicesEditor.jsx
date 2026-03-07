import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LocalizedInput from '@/components/ui/LocalizedInput';

function ServicesEditor({ data = {}, updateField }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedInput
            label="Title"
            value={data.library?.title}
            onChange={(value) => updateField('library', 'title', value)}
          />
          <LocalizedInput
            label="Content"
            type="richtext"
            value={data.library?.content}
            onChange={(value) => updateField('library', 'content', value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ServicesEditor;
