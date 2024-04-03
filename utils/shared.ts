import { dataDescriptions, defaultDataView, secondaryDataView } from './datasetDefinitions'
import { EmissionSector } from './types'

export const normalizeString = (input: string) => input.replace('ä', 'a').replace('ö', 'o').replace('å', 'a').toLowerCase()

export const toTitleCase = (str: string) => str.replace(
  /\w\S*/g,
  (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
)

export const validDatasetsMap = Object.keys(dataDescriptions).reduce<
  Record<string, string>
>((acc, key) => {
  const normalizedKey = normalizeString(key)
  acc[normalizedKey] = key
  return acc
}, {})

export const isValidDataset = (dataset: string) => {
  const normalizedDataset = normalizeString(dataset as string)
  return validDatasetsMap[normalizedDataset]
}

export const isValidDataView = (dataView: string) => [defaultDataView, secondaryDataView].includes(dataView)

export const replaceLetters = (name: string): string => {
  const replacements: Record<string, string> = {
    'Ã¥': 'å',
    'Ã¤': 'ä',
    'Ã¶': 'ö',
    'Ã…': 'Å',
    'Ã„': 'Ä',
    'Ã–': 'Ö',
  }

  const regex = new RegExp(Object.keys(replacements).join('|'), 'g')

  return name.replace(regex, (match) => replacements[match])
}

const sectorMappings: { [key: string]: string } = {
  Transporter: 'Transport',
  'Utrikes transporter': 'Transport',
  'Industri (energi + processer)': 'Industri',
  Jordbruk: 'Jordbruk',
  'Egen uppvärmning av bostäder och lokaler': 'Energi',
  'El och fjärrvärme': 'Energi',
  Arbetsmaskiner: 'Övrigt',
  'Produktanvändning (inkl. lösningsmedel)': 'Övrigt',
  'Avfall (inkl.avlopp)': 'Övrigt',
}

export const groupEmissionSectors = (emissions: EmissionSector[]): EmissionSector[] => {
  const aggregatedSectors: { [key: string]: EmissionSector } = {}

  emissions.forEach((sector) => {
    const mappedName = sectorMappings[sector.Name] || sector.Name
    if (!aggregatedSectors[mappedName]) {
      aggregatedSectors[mappedName] = { Name: mappedName, EmissionsPerYear: [] }
    }
    sector.EmissionsPerYear.forEach((emissionPerYear) => {
      const existingEmission = aggregatedSectors[mappedName].EmissionsPerYear.find(
        (e) => e.Year === emissionPerYear.Year,
      )
      if (existingEmission) {
        existingEmission.CO2Equivalent += emissionPerYear.CO2Equivalent
      } else {
        aggregatedSectors[mappedName].EmissionsPerYear.push({ ...emissionPerYear })
      }
    })
  })

  return Object.values(aggregatedSectors)
}
