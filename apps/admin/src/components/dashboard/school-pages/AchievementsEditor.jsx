import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LocalizedInput from '@/components/ui/LocalizedInput';

function AchievementsEditor({ data = {}, updateField }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">School Achievements</CardTitle>
        <CardDescription>Awards, competitions, and recognitions</CardDescription>
      </CardHeader>
      <CardContent>
        <LocalizedInput
          label="Page Description"
          type="textarea"
          value={data.achievementsPage?.description}
          onChange={(value) => updateField('achievementsPage', 'description', value)}
        />
      </CardContent>
    </Card>
  );
}

export default AchievementsEditor;
