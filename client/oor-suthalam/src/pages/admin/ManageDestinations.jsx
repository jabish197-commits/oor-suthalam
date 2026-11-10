import CatalogManager from '../../components/common/CatalogManager';
import { destinationService } from '../../services/destinationService';

const fields = [
  { name: 'name', label: 'Destination name', minLength: 2, maxLength: 100 },
  { name: 'region', label: 'District / state', minLength: 2, maxLength: 100 },
  {
    name: 'category',
    label: 'Category',
    options: ['Nature', 'Heritage', 'Coast', 'City'].map((value) => ({
      value,
      label: value,
    })),
  },
  {
    name: 'lat',
    label: 'Town latitude (8–14)',
    type: 'number',
    min: 8,
    max: 14,
    step: 'any',
    required: false,
    hint: 'Needed for budget planning; approximate town centre.',
  },
  {
    name: 'lng',
    label: 'Town longitude (76–81)',
    type: 'number',
    min: 76,
    max: 81,
    step: 'any',
    required: false,
  },
  {
    name: 'hiddenGem',
    label: 'Discovery type',
    options: [
      { value: 'false', label: 'Popular destination' },
      { value: 'true', label: 'Quieter discovery' },
    ],
  },
  {
    name: 'accessNote',
    label: 'Visitor access notes',
    type: 'textarea',
    required: false,
    maxLength: 1000,
  },
  {
    name: 'dailyBudget',
    label: 'Daily budget per person (₹)',
    type: 'number',
    min: 0,
    max: 1000000,
  },
  {
    name: 'image',
    label: 'Destination photo',
    type: 'file',
    required: false,
    hint: 'Choose a JPEG, PNG or WebP photo from your device (maximum 5 MB).',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    minLength: 10,
    maxLength: 5000,
  },
  {
    name: 'activities',
    label: 'Activities',
    type: 'textarea',
    required: false,
    hint: 'One activity per line.',
  },
  {
    name: 'indoorActivities',
    label: 'Indoor alternatives',
    type: 'textarea',
    required: false,
    hint: 'One Plan B activity per line.',
  },
];

const lines = (value) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export default function ManageDestinations() {
  return (
    <CatalogManager
      title="Destinations."
      service={destinationService}
      fields={fields}
      buildBody={(values) => ({
        ...values,
        dailyBudget: Number(values.dailyBudget),
        hiddenGem: String(values.hiddenGem) === 'true',
        lat: values.lat === '' || values.lat == null ? undefined : Number(values.lat),
        lng: values.lng === '' || values.lng == null ? undefined : Number(values.lng),
        activities: lines(values.activities),
        indoorActivities: lines(values.indoorActivities),
      })}
      toForm={(item) => ({
        ...item,
        hiddenGem: String(item.hiddenGem || false),
        activities: (item.activities || []).join('\n'),
        indoorActivities: (item.indoorActivities || []).join('\n'),
      })}
    />
  );
}
