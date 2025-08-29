import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

interface LastOptimizationResultProps {
  lastResult: any;
  onClear: () => void;
}

export const LastOptimizationResult: React.FC<LastOptimizationResultProps> = ({
  lastResult,
  onClear,
}) => {
  if (!lastResult) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChefHat className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-medium text-green-800">
          آخرین نتیجه بهینه‌سازی
        </h3>
      </div>

      {/* خلاصه نتیجه */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-sm">
          <p className="font-medium text-green-700">کالری:</p>
          <p className="text-green-600">
            {lastResult.nutritional_totals?.calories || "N/A"} kcal
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-green-700">پروتئین:</p>
          <p className="text-green-600">
            {lastResult.nutritional_totals?.protein || "N/A"}g
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-green-700">کربوهیدرات:</p>
          <p className="text-green-600">
            {lastResult.nutritional_totals?.carbs || "N/A"}g
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-green-700">چربی:</p>
          <p className="text-green-600">
            {lastResult.nutritional_totals?.fat || "N/A"}g
          </p>
        </div>
      </div>

      {/* Target Achievement */}
      {lastResult.target_achievement && (
        <div className="mb-4">
          <h4 className="font-medium text-green-700 mb-2">دستیابی به اهداف:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${lastResult.target_achievement.calories ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span className="text-sm text-green-700">کالری</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${lastResult.target_achievement.protein ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span className="text-sm text-green-700">پروتئین</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${lastResult.target_achievement.carbs ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span className="text-sm text-green-700">کربوهیدرات</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${lastResult.target_achievement.fat ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span className="text-sm text-green-700">چربی</span>
            </div>
          </div>
        </div>
      )}

      {/* جزئیات بیشتر */}
      <details className="text-sm">
        <summary className="cursor-pointer text-green-700 font-medium hover:text-green-800">
          مشاهده جزئیات بیشتر
        </summary>
        <div className="mt-2 p-3 bg-white rounded border">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      </details>

      {/* دکمه پاک کردن */}
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          className="text-green-700 border-green-300 hover:bg-green-100"
        >
          پاک کردن نتیجه
        </Button>
      </div>
    </div>
  );
};
