import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { indianStatesAndCities, getCitiesByState, getAllStates } from "@/data/indianStatesCities";

interface StateCitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
}

const StateCitySelector = ({ 
  selectedState, 
  selectedCity, 
  onStateChange, 
  onCityChange 
}: StateCitySelectorProps) => {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedState) {
      const citiesForState = getCitiesByState(selectedState);
      setCities(citiesForState);
      // Clear city selection if it's not valid for the new state
      if (selectedCity && !citiesForState.includes(selectedCity)) {
        onCityChange('');
      }
    } else {
      setCities([]);
    }
  }, [selectedState]); // Removed selectedCity and onCityChange from dependencies to prevent infinite loops

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label htmlFor="state">State *</Label>
        <Select value={selectedState} onValueChange={onStateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {getAllStates().map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="city">City *</Label>
        <Select 
          value={selectedCity} 
          onValueChange={onCityChange}
          disabled={!selectedState}
        >
          <SelectTrigger>
            <SelectValue placeholder={selectedState ? "Select city" : "Select state first"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StateCitySelector;