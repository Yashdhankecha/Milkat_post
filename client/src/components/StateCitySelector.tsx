import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface StateCitySelectorProps {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
}

// Indian states and their major cities
const statesAndCities = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", 
    "Rajahmundry", "Kadapa", "Tirupati", "Anantapur", "Vizianagaram", "Eluru"
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Naharlagun", "Pasighat", "Tezpur", "Bomdila", "Tawang", 
    "Ziro", "Along", "Changlang", "Tezu"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", 
    "Tezpur", "Bongaigaon", "Dhubri", "North Lakhimpur", "Karimganj", "Sivasagar"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", 
    "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", 
    "Jagdalpur", "Raigarh", "Ambikapur", "Mahasamund"
  ],
  "Goa": [
    "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", 
    "Curchorem", "Sanquelim"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", 
    "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Mehsana", 
    "Bharuch", "Vapi", "Palanpur", "Valsad"
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", 
    "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", 
    "Bahadurgarh", "Jind", "Thanesar", "Kaithal"
  ],
  "Himachal Pradesh": [
    "Shimla", "Solan", "Dharamshala", "Mandi", "Palampur", "Baddi", 
    "Una", "Kullu", "Hamirpur", "Bilaspur", "Chamba", "Kangra"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", 
    "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chirkunda"
  ],
  "Karnataka": [
    "Bangalore", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Gulbarga", 
    "Davanagere", "Bellary", "Bijapur", "Shimoga", "Tumkur", "Raichur", 
    "Bidar", "Hospet", "Hassan", "Gadag-Betageri", "Udupi", "Robertson Pet"
  ],
  "Kerala": [
    "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Palakkad", 
    "Alappuzha", "Malappuram", "Kannur", "Kasaragod", "Kottayam", "Idukki", 
    "Pathanamthitta", "Wayanad"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", 
    "Dewas", "Satna", "Ratlam", "Rewa", "Katni", "Singrauli", 
    "Burhanpur", "Khandwa", "Bhind", "Chhindwara", "Guna", "Shivpuri"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", 
    "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Bhiwandi", "Amravati", 
    "Nanded", "Kolhapur", "Ulhasnagar", "Sangli-Miraj & Kupwad", "Malegaon", 
    "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", 
    "Ichalkaranji", "Jalna", "Ambarnath", "Bhusawal", "Panvel", "Badlapur", 
    "Beed", "Gondia", "Satara", "Barshi", "Yavatmal", "Achalpur", "Osmanabad"
  ],
  "Manipur": [
    "Imphal", "Thoubal", "Lilong", "Mayang Imphal", "Ukhrul"
  ],
  "Meghalaya": [
    "Shillong", "Tura", "Nongstoin", "Jowai", "Baghmara", "Williamnagar"
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip"
  ],
  "Nagaland": [
    "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Mon"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", 
    "Balasore", "Bhadrak", "Baripada", "Jharsuguda"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Hoshiarpur", 
    "Batala", "Pathankot", "Moga", "Abohar", "Malerkotla", "Khanna", 
    "Phagwara", "Muktsar", "Barnala", "Rajpura", "Firozpur", "Kapurthala"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", 
    "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali", "Sri Ganganagar", 
    "Kishangarh", "Baran", "Dhaulpur", "Tonk", "Beawar", "Hanumangarh"
  ],
  "Sikkim": [
    "Gangtok", "Namchi", "Geyzing", "Mangan"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", 
    "Tiruppur", "Vellore", "Erode", "Thoothukkudi", "Dindigul", "Thanjavur", 
    "Ranipet", "Sivakasi", "Karur", "Udhagamandalam", "Hosur", "Nagercoil", 
    "Kanchipuram", "Kumarakoil", "Karaikkudi", "Neyveli", "Cuddalore", 
    "Kumbakonam", "Tiruvannamalai", "Pollachi", "Rajapalayam", "Gudiyatham"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", 
    "Mahabubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Jagtial", 
    "Mancherial", "Nirmal", "Kothagudem", "Bodhan", "Sangareddy", "Metpally", "Bellampalle"
  ],
  "Tripura": [
    "Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Belonia", "Khowai"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", 
    "Allahabad", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", 
    "Noida", "Firozabad", "Loni", "Jhansi", "Muzaffarnagar", "Mathura", 
    "Shahjahanpur", "Rampur", "Mau", "Farrukhabad", "Hapur", "Ayodhya", 
    "Etawah", "Mirzapur", "Bulandshahr", "Sambhal", "Amroha", "Hardoi", 
    "Fatehpur", "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar", 
    "Unnao", "Jaunpur", "Lakhimpur", "Hathras", "Banda"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Rudrapur", "Kashipur", "Haldwani", 
    "Rishikesh", "Kotdwar", "Ramnagar", "Pithoragarh", "Jaspur", "Kichha"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", 
    "Bardhaman", "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni", 
    "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip", 
    "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Chakdaha", 
    "Darjeeling", "Alipurduar", "Purulia", "Jangipur"
  ],
  "Andaman and Nicobar Islands": [
    "Port Blair", "Bamboo Flat", "Garacharma", "Diglipur", "Ferrargunj"
  ],
  "Chandigarh": [
    "Chandigarh"
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Daman", "Diu", "Silvassa"
  ],
  "Delhi": [
    "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", 
    "Central Delhi", "North East Delhi", "North West Delhi", "South East Delhi", 
    "South West Delhi", "Shahdara"
  ],
  "Jammu and Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "KathuaJ", 
    "Rajauri", "Punch", "Udhampur", "Samba"
  ],
  "Ladakh": [
    "Leh", "Kargil"
  ],
  "Lakshadweep": [
    "Kavaratti", "Agatti", "Minicoy"
  ],
  "Puducherry": [
    "Puducherry", "Oulgaret", "Karaikal", "Mahe", "Yanam"
  ]
};

const StateCitySelector = ({ 
  selectedState, 
  selectedCity, 
  onStateChange, 
  onCityChange 
}: StateCitySelectorProps) => {
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedState && statesAndCities[selectedState as keyof typeof statesAndCities]) {
      setCities(statesAndCities[selectedState as keyof typeof statesAndCities]);
      // Clear city selection if it's not valid for the new state
      if (selectedCity && !statesAndCities[selectedState as keyof typeof statesAndCities].includes(selectedCity)) {
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
            {Object.keys(statesAndCities).map((state) => (
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
          disabled={!selectedState || cities.length === 0}
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