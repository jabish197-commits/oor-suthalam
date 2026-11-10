import { Link } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { destinationService } from '../../services/destinationService';
import { packageService } from '../../services/packageService';
import Resource from '../../components/common/Resource';
import CatalogManager from '../../components/common/CatalogManager';

export default function ManagePackages() {
  const destinations = useResource(destinationService.list);

  return (
    <Resource resource={destinations} allowEmpty>
      {(places) => (
        <CatalogManager
          title="Packages."
          service={packageService}
          labelKey="title"
          removeLabel="Archive"
          prerequisite={
            places.length ? null : (
              <>
                <strong>A package needs a destination.</strong>
                <p>Create your first destination, then return here to add its package.</p>
                <Link className="underlined" to="/admin/destinations">
                  Create a destination first{' '}
                </Link>
              </>
            )
          }
          fields={[
            {
              name: 'priceMode',
              label: 'Pricing',
              options: [
                { value: 'fixed', label: 'Published reference price' },
                { value: 'quote', label: 'Personalised quote required' },
              ],
            },
            {
              name: 'travelType',
              label: 'Travel type',
              options: [{ value: 'land', label: 'Land itinerary' }],
            },
            {
              name: 'title',
              label: 'Package title',
              minLength: 2,
              maxLength: 150,
            },
            {
              name: 'destination',
              label: 'Destination',
              options: places.map((place) => ({
                value: place._id,
                label: place.name,
              })),
            },
            {
              name: 'days',
              label: 'Days',
              type: 'number',
              min: 1,
              max: 30,
            },
            {
              name: 'price',
              label: 'Price per person (₹)',
              type: 'number',
              min: 0,
              max: 10000000,
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              minLength: 10,
              maxLength: 5000,
            },
            {
              name: 'inclusions',
              label: 'Inclusions',
              type: 'textarea',
              required: false,
              hint: 'One inclusion per line.',
            },
          ]}
          buildBody={(values) => ({
            ...values,
            days: Number(values.days),
            price: Number(values.price),
            inclusions: values.inclusions
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean),
          })}
          toForm={(item) => ({
            ...item,
            priceMode: item.priceMode || 'fixed',
            travelType: item.travelType || 'land',
            destination: item.destination?._id || item.destination,
            inclusions: (item.inclusions || []).join('\n'),
          })}
        />
      )}
    </Resource>
  );
}
