import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LocalizedInput from '@/components/ui/LocalizedInput';

function AlumniEditor({ data = {}, updateField }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alumni</CardTitle>
        <CardDescription>Featured alumni and association info</CardDescription>
      </CardHeader>
      <CardContent>
        <LocalizedInput
          label="Page Description"
          type="textarea"
          value={data.alumniPage?.description}
          onChange={(value) => updateField('alumniPage', 'description', value)}
        />
      </CardContent>
    </Card>
  );
}

export default AlumniEditor;
