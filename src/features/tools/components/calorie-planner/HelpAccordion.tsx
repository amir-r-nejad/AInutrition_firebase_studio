import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

function HelpAccordion() {
  return (
    <AccordionItem value='help-section'>
      <AccordionTrigger className='text-xl font-semibold'>
        <div className='flex items-center'>
          <HelpCircle className='mr-2 h-6 w-6 text-primary' /> How is this
          calculated?
        </div>
      </AccordionTrigger>
      <AccordionContent className='text-sm space-y-4 pt-3 max-h-96 overflow-y-auto'>
        <div>
          <h4 className='font-semibold text-base'>
            1. Basal Metabolic Rate (BMR) &amp; Total Daily Energy Expenditure
            (TDEE)
          </h4>{' '}
          <p>
            We use the{' '}
            <strong className='text-primary'>Mifflin-St Jeor Equation</strong>{' '}
            for BMR, then multiply by an{' '}
            <strong className='text-primary'>activity factor</strong> (derived
            from your selected &lsquo;Physical Activity Level&rsquo;) for TDEE.
          </p>
        </div>
        <div>
          <h4 className='font-semibold text-base mt-2'>
            2. Target Daily Calories
          </h4>
          <p>
            This is determined based on your goals, selected &quot;Diet
            Goal&quot;, and optionally, body composition changes:
          </p>
          <ul className='list-disc pl-5 space-y-1 mt-1'>
            <li>
              <strong>Primary Goal (Weight &amp; Diet Goal):</strong> Initially
              calculated from your 1-month weight target. Your &quot;Diet
              Goal&quot; (e.g., &quot;Fat loss,&quot; &quot;Muscle gain&quot;)
              then refines this. For example, &quot;Fat loss&quot; aims for a
              deficit (e.g., TDEE - 200 to -500 kcal), while &quot;Muscle
              gain&quot; aims for a surplus (e.g., TDEE + 150 to +300 kcal).
              &quot;Recomposition&quot; targets a slight deficit or
              near-maintenance calories. These adjustments ensure the calorie
              target aligns with your primary objective.
            </li>
            <li>
              <strong>Body Fat % Goal (Optional Refinement):</strong> If you
              provide current and target body fat percentages, the calorie
              target may be further refined by averaging the weight-goal-based
              calories with calories estimated to achieve your body fat change.
            </li>
            <li>
              <strong>Waist Goal (Alternative View):</strong> If waist goals are
              provided, an alternative calorie target is estimated for
              perspective. This is not the primary target but an additional
              indicator.
            </li>
          </ul>
        </div>
        <div>
          <h4 className='font-semibold text-base mt-2'>
            3. Suggested Macro Split (Default)
          </h4>
          <p>
            The default suggested protein/carb/fat percentage split (shown in
            the &lsquo;Original Plan&rsquo; results) is based on your selected
            &quot;Diet Goal&quot;:
          </p>
          <ul className='list-disc pl-5 space-y-1 mt-1'>
            <li>
              <strong>Fat Loss:</strong> Approx. 35% Protein / 35% Carbs / 30%
              Fat
            </li>
            <li>
              <strong>Muscle Gain:</strong> Approx. 30% Protein / 50% Carbs /
              20% Fat
            </li>
            <li>
              <strong>Recomposition:</strong> Approx. 40% Protein / 35% Carbs /
              25% Fat
            </li>
          </ul>
          <p className='mt-1'>
            You can further customize this in the &quot;Customize Your
            Plan&quot; section below.
          </p>
        </div>
        <div>
          <h4 className='font-semibold text-base mt-2'>4. Safe Pace</h4>
          <p>
            Sustainable weight loss is often around 0.5–1 kg (1–2 lbs) per week.
            Muscle gain is slower, around 0.25–0.5 kg (0.5–1 lb) per week. Large
            body composition or measurement changes in just 1 month may be
            unrealistic for many.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default HelpAccordion;
