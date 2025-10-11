# VetRetire Database Schema Documentation

This document explains the data structure for retirement locations in the VetRetire application.

## Location Model Fields

### Basic Location Information
- **State**: Two-letter state abbreviation (e.g., "FL", "CA")
- **City**: City name
- **County**: County name

### Political Information
- **StateParty**: Political party controlling the state (R/D)
- **Governor**: Political party of the state governor (R/D)
- **CityPolitics**: Political leaning of the city (e.g., "Progressive", "Moderately Conservative")
- **2016Election**: Presidential election winner in 2016 (Trump/Clinton)
- **2016PresidentPercent**: Percentage of vote for winner in 2016
- **2024 Election**: Presidential election winner in 2024 (Trump/Harris)
- **2024PresidentPercent**: Percentage of vote for winner in 2024
- **ElectionChange**: How voting patterns shifted between 2016-2024 (e.g., "5% more Democratic")

### Demographics & Economics
- **Population**: Population of the metro area/county
- **Density**: Population density (people per square mile)
- **Sales Tax**: Sales tax percentage
- **Income**: State income tax percentage (0.00 = no income tax)
- **COL**: Cost of Living index (100 = national average)

### Veterans Affairs
- **VA**: Whether location has a VA facility ("Yes"/"No")
- **NearestVA**: Name of nearest VA facility (if VA = "No")
- **DistanceToVA**: Distance to nearest VA facility (e.g., "24 miles", "NA" if local)
- **Veterans Benefits**: Additional veteran-specific benefits/tax breaks available

### Safety & Social
- **TCI**: Total Crime Index (lower is safer, national average = 100)
- **Marijuana**: Legal status (Recreational/Medical/Decriminalized/Illegal)
- **LGBTQ**: LGBTQ-friendly rating or community presence

### Economic Hubs
- **TechHub**: Whether location is a technology hub (Y/N)
- **DefenseHub**: Whether location has significant defense/military presence (Y/N)

### Weather & Climate
- **Snow**: Average annual snowfall (inches)
- **Rain**: Average annual rainfall (inches)
- **Sun**: Average days of sunshine per year
- **ALW**: Average Low in Winter (temperature in °F)
- **AHS**: Average High in Summer (temperature in °F)
- **HumiditySummer**: Average humidity percentage in July (representative of summer)
- **Climate**: Climate zone description (e.g., "Humid subtropical", "Hot desert")

### Other
- **Gas**: Average gas price per gallon (formatted as currency)
- **Description**: Marketing/descriptive text about the location

## Data Types & Formats

### Numeric Fields
- Population: Formatted with commas (e.g., "413,066")
- Density, Sales Tax, Income: Decimal numbers
- COL, TCI: Integer index values
- Snow, Rain, Sun, ALW, AHS, HumiditySummer: Integer values

### Text Fields
- Election percentages: Integer (e.g., 61)
- ElectionChange: Percentage with direction (e.g., "5% less Democratic")
- Gas prices: Currency formatted (e.g., "$2.46")
- DistanceToVA: Distance string (e.g., "24 miles") or "NA"
- LGBTQ: Number or text indicator
- Yes/No fields: "Y"/"N" or "Yes"/"No"

### Nullable/Optional Fields
- Many fields may be empty or contain "?" for unknown values
- NearestVA and DistanceToVA only populated when VA = "No"
- Veterans Benefits may be empty if none specific

## Notes
- Data sourced from various public datasets and APIs
- Cost of Living (COL) uses 100 as the national average baseline
- Crime Index (TCI) uses similar baseline where 100 = national average
- Political data represents county-level results in most cases
