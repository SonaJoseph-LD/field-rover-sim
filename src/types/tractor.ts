export interface TractorModel {
  id: string;
  name: string;
  size: {
    length: number; // meters
    width: number; // meters
  };
  turnRadius: number; // meters
  maxSpeed: number; // km/h
  implements: string[];
}

export interface TractorPosition {
  lat: number;
  lng: number;
  heading: number; // degrees
}

export interface TractorAction {
  type: "harvest" | "spray" | "observe" | "idle";
  active: boolean;
}

export const TRACTOR_MODELS: TractorModel[] = [
  {
    id: "8r-370",
    name: "John Deere 8R 370",
    size: { length: 6.5, width: 3.0 },
    turnRadius: 5.5,
    maxSpeed: 40,
    implements: ["harvester", "sprayer", "planter"],
  },
  {
    id: "9r-540",
    name: "John Deere 9R 540",
    size: { length: 7.2, width: 3.2 },
    turnRadius: 6.0,
    maxSpeed: 42,
    implements: ["harvester", "sprayer", "planter", "tillage"],
  },
  {
    id: "6m-215",
    name: "John Deere 6M 215",
    size: { length: 5.8, width: 2.5 },
    turnRadius: 4.8,
    maxSpeed: 40,
    implements: ["sprayer", "planter"],
  },
];

export const DEFAULT_POSITION: TractorPosition = {
  lat: 40.7128, // New York area farmland
  lng: -74.006,
  heading: 0,
};
