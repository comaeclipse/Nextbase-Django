import { describe, expect, it } from "vitest";
import {
  classifySector,
  normalizeEmployment,
  normalizePayInterval,
} from "./defense-jobs-sectors";

describe("classifySector", () => {
  it.each([
    ["Senior Software Engineer", "Dev", "Software & Data"],
    ["Machine Learning Engineer", "Hivemind Solutions Division", "Software & Data"],
    ["Autonomy Software Engineer", "X-BAT Division", "Software & Data"],
    ["Data Scientist", "Growth Division", "Software & Data"],
    ["Mechanical Engineer", "Manufacturing", "Hardware & Engineering"],
    ["RF Systems Engineer", "Engineering", "Hardware & Engineering"],
    ["Avionics Test Engineer", "V-BAT Division", "Hardware & Engineering"],
    ["Aviation Electrician", "Trades", "Hardware & Engineering"],
    ["Marine Electrician", "Shipyard", "Hardware & Engineering"],
    ["Industrial Electrician", "Plant Maintenance", "Hardware & Engineering"],
    ["Electrical Engineer", "Engineering", "Hardware & Engineering"],
    ["Manufacturing Technician", "Manufacturing", "Manufacturing & Production"],
    ["Supply Chain Manager", "Operations", "Manufacturing & Production"],
    ["Quality Inspector", "Manufacturing", "Manufacturing & Production"],
    ["Flight Test Engineer", "Aircraft Operations Division", "Mission & Flight Ops"],
    ["Air Vehicle Operator", "Aircraft Operations Division", "Mission & Flight Ops"],
    ["Forward Deployed Software Engineer", "Delta", "Mission & Flight Ops"],
    ["Field Service Technician", "Mission Ops", "Mission & Flight Ops"],
    ["Senior Product Manager", "Product Development", "Product & Design"],
    ["Product Designer", "Design", "Product & Design"],
    ["Account Executive", "Growth Division", "Business & Growth"],
    ["Business Development Lead", "Business Development", "Business & Growth"],
    ["Growth Marketing Manager", "Growth Division", "Business & Growth"],
    ["Information Security Engineer", "Information Security", "Security & IT"],
    ["Cybersecurity Analyst", "Information Security", "Security & IT"],
    ["Staff Accountant", "Finance Division", "Corporate & G&A"],
    ["Corporate Counsel", "Legal", "Corporate & G&A"],
    ["Technical Recruiter", "Recruiting", "Corporate & G&A"],
    ["Administrative Business Partner", "Administrative", "Corporate & G&A"],
    // Federal (USAJOBS/NAVSEA) titles: contracting/acquisition -> Corporate & G&A,
    // security specialist -> Security & IT, admin/technical -> Corporate.
    ["Contract Specialist", "Contracting (1102) · GS 11-12", "Corporate & G&A"],
    ["Supervisory General Business & Industrial Specialist", "General Business and Industry (1101) · NH 3", "Corporate & G&A"],
    ["Security Specialist (Administration)", "Security Administration (0080) · NH 2", "Security & IT"],
    ["Administrative/Technical Specialist", "Logistics Management (0346) · NT 5", "Corporate & G&A"],
    ["Logistics Management Specialist", "Logistics Management (0346) · GS 13", "Manufacturing & Production"],
    ["IT Specialist (INFOSEC)", "Information Technology Management (2210) · NT 5", "Security & IT"],
    ["Quality Assurance Specialist (Shipbuilding)", "Quality Assurance (1910) · GS 5-7", "Manufacturing & Production"],
  ])("%s / %s -> %s", (title, field, expected) => {
    expect(classifySector(title, field)).toBe(expected);
  });

  it("falls back to Field when the title is uninformative", () => {
    expect(classifySector("Lead", "Software Eng")).toBe("Software & Data");
    expect(classifySector("Analyst", "Finance")).toBe("Corporate & G&A");
  });

  it("returns Other when nothing matches", () => {
    expect(classifySector("Miscellaneous Role", "Echo")).toBe("Other");
    expect(classifySector("", "")).toBe("Other");
  });
});

describe("normalizeEmployment", () => {
  it.each([
    ["Full Time Employee", "Full-time"],
    ["FullTime", "Full-time"],
    ["Full-time", "Full-time"],
    ["International EOR", "Full-time"],
    ["International Office Entity", "Full-time"],
    ["Internship", "Internship"],
    ["Intern", "Internship"],
    ["Contractor", "Contract"],
    ["Contract", "Contract"],
    ["Fixed-Term", "Fixed-Term"],
    ["Scholarship", "Scholarship"],
    ["", null],
  ])("%s -> %s", (raw, expected) => {
    expect(normalizeEmployment(raw)).toBe(expected);
  });
});

describe("normalizePayInterval", () => {
  it.each([
    ["per-year-salary", "year"],
    ["per-year", "year"],
    ["per-hour-wage", "hour"],
    ["per-hour", "hour"],
    ["per-month-salary", "month"],
    ["", null],
  ])("%s -> %s", (raw, expected) => {
    expect(normalizePayInterval(raw)).toBe(expected);
  });
});
