import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LocalizedInput from '@/components/ui/LocalizedInput';

function ContactEditor({ data = {}, updateField }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LocalizedInput
          label="Address"
          type="textarea"
          value={data.contactInfo?.address}
          onChange={(value) => updateField('contactInfo', 'address', value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Phone</Label>
            <Input
              value={data.contactInfo?.phone || ''}
              onChange={(event) => updateField('contactInfo', 'phone', event.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={data.contactInfo?.email || ''}
              onChange={(event) => updateField('contactInfo', 'email', event.target.value)}
              placeholder="Email address"
            />
          </div>
        </div>

        <LocalizedInput
          label="Operational Hours"
          value={data.contactInfo?.operationalHours}
          onChange={(value) => updateField('contactInfo', 'operationalHours', value)}
        />

        <div>
          <Label>Google Maps Embed URL</Label>
          <Input
            value={data.mapEmbed || ''}
            onChange={(event) => updateField('mapEmbed', event.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default ContactEditor;
