import { Lab } from "@/components/lab/Lab";
import { LabErrorBoundary } from "@/components/lab/LabErrorBoundary";

// Test fixture (QA Q04): two independent lab instances on one page, to prove their shared-identity namespaces are
// isolated. Routed only when LAB_FIXTURES=1 (see next.config.ts); not part of the product.
export default function TwoLabs() {
  return <LabErrorBoundary>
    <div data-lab-instance="a"><Lab id="button" /></div>
    <div data-lab-instance="b"><Lab id="toast" /></div>
  </LabErrorBoundary>;
}
