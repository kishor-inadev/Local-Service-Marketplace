import { SettingsLayout } from '@/components/layout/SettingsLayout';
import { PaymentMethods } from '@/components/features/payment/PaymentMethods';

export default function PaymentMethodsPage() {
  return (
    <SettingsLayout>
      <PaymentMethods />
    </SettingsLayout>
  );
}
