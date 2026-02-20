<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { Search, ChevronDown } from "lucide-svelte"

  export let value = ""
  export let placeholder = "Selecciona un país..."
  export let id = ""
  export let disabled = false

  const dispatch = createEventDispatcher()

  let isOpen = false
  let searchQuery = ""
  let dropdownRef: HTMLDivElement

  // Lista de países en español con sus banderas (emojis)
  const countries = [
    { name: "Afganistán", flag: "🇦🇫" },
    { name: "Albania", flag: "🇦🇱" },
    { name: "Alemania", flag: "🇩🇪" },
    { name: "Andorra", flag: "🇦🇩" },
    { name: "Angola", flag: "🇦🇴" },
    { name: "Antigua y Barbuda", flag: "🇦🇬" },
    { name: "Arabia Saudita", flag: "🇸🇦" },
    { name: "Argelia", flag: "🇩🇿" },
    { name: "Argentina", flag: "🇦🇷" },
    { name: "Armenia", flag: "🇦🇲" },
    { name: "Australia", flag: "🇦🇺" },
    { name: "Austria", flag: "🇦🇹" },
    { name: "Azerbaiyán", flag: "🇦🇿" },
    { name: "Bahamas", flag: "🇧🇸" },
    { name: "Bangladés", flag: "🇧🇩" },
    { name: "Barbados", flag: "🇧🇧" },
    { name: "Baréin", flag: "🇧🇭" },
    { name: "Bélgica", flag: "🇧🇪" },
    { name: "Belice", flag: "🇧🇿" },
    { name: "Benín", flag: "🇧🇯" },
    { name: "Bielorrusia", flag: "🇧🇾" },
    { name: "Birmania", flag: "🇲🇲" },
    { name: "Bolivia", flag: "🇧🇴" },
    { name: "Bosnia y Herzegovina", flag: "🇧🇦" },
    { name: "Botsuana", flag: "🇧🇼" },
    { name: "Brasil", flag: "🇧🇷" },
    { name: "Brunéi", flag: "🇧🇳" },
    { name: "Bulgaria", flag: "🇧🇬" },
    { name: "Burkina Faso", flag: "🇧🇫" },
    { name: "Burundi", flag: "🇧🇮" },
    { name: "Bután", flag: "🇧🇹" },
    { name: "Cabo Verde", flag: "🇨🇻" },
    { name: "Camboya", flag: "🇰🇭" },
    { name: "Camerún", flag: "🇨🇲" },
    { name: "Canadá", flag: "🇨🇦" },
    { name: "Catar", flag: "🇶🇦" },
    { name: "Chad", flag: "🇹🇩" },
    { name: "Chile", flag: "🇨🇱" },
    { name: "China", flag: "🇨🇳" },
    { name: "Chipre", flag: "🇨🇾" },
    { name: "Ciudad del Vaticano", flag: "🇻🇦" },
    { name: "Colombia", flag: "🇨🇴" },
    { name: "Comoras", flag: "🇰🇲" },
    { name: "Corea del Norte", flag: "🇰🇵" },
    { name: "Corea del Sur", flag: "🇰🇷" },
    { name: "Costa de Marfil", flag: "🇨🇮" },
    { name: "Costa Rica", flag: "🇨🇷" },
    { name: "Croacia", flag: "🇭🇷" },
    { name: "Cuba", flag: "🇨🇺" },
    { name: "Dinamarca", flag: "🇩🇰" },
    { name: "Dominica", flag: "🇩🇲" },
    { name: "Ecuador", flag: "🇪🇨" },
    { name: "Egipto", flag: "🇪🇬" },
    { name: "El Salvador", flag: "🇸🇻" },
    { name: "Emiratos Árabes Unidos", flag: "🇦🇪" },
    { name: "Eritrea", flag: "🇪🇷" },
    { name: "Eslovaquia", flag: "🇸🇰" },
    { name: "Eslovenia", flag: "🇸🇮" },
    { name: "España", flag: "🇪🇸" },
    { name: "Estados Unidos", flag: "🇺🇸" },
    { name: "Estonia", flag: "🇪🇪" },
    { name: "Etiopía", flag: "🇪🇹" },
    { name: "Filipinas", flag: "🇵🇭" },
    { name: "Finlandia", flag: "🇫🇮" },
    { name: "Fiyi", flag: "🇫🇯" },
    { name: "Francia", flag: "🇫🇷" },
    { name: "Gabón", flag: "🇬🇦" },
    { name: "Gambia", flag: "🇬🇲" },
    { name: "Georgia", flag: "🇬🇪" },
    { name: "Ghana", flag: "🇬🇭" },
    { name: "Granada", flag: "🇬🇩" },
    { name: "Grecia", flag: "🇬🇷" },
    { name: "Guatemala", flag: "🇬🇹" },
    { name: "Guyana", flag: "🇬🇾" },
    { name: "Guinea", flag: "🇬🇳" },
    { name: "Guinea ecuatorial", flag: "🇬🇶" },
    { name: "Guinea-Bisáu", flag: "🇬🇼" },
    { name: "Haití", flag: "🇭🇹" },
    { name: "Honduras", flag: "🇭🇳" },
    { name: "Hungría", flag: "🇭🇺" },
    { name: "India", flag: "🇮🇳" },
    { name: "Indonesia", flag: "🇮🇩" },
    { name: "Irak", flag: "🇮🇶" },
    { name: "Irán", flag: "🇮🇷" },
    { name: "Irlanda", flag: "🇮🇪" },
    { name: "Islandia", flag: "🇮🇸" },
    { name: "Islas Marshall", flag: "🇲🇭" },
    { name: "Islas Salomón", flag: "🇸🇧" },
    { name: "Israel", flag: "🇮🇱" },
    { name: "Italia", flag: "🇮🇹" },
    { name: "Jamaica", flag: "🇯🇲" },
    { name: "Japón", flag: "🇯🇵" },
    { name: "Jordania", flag: "🇯🇴" },
    { name: "Kazajistán", flag: "🇰🇿" },
    { name: "Kenia", flag: "🇰🇪" },
    { name: "Kirguistán", flag: "🇰🇬" },
    { name: "Kiribati", flag: "🇰🇮" },
    { name: "Kuwait", flag: "🇰🇼" },
    { name: "Laos", flag: "🇱🇦" },
    { name: "Lesoto", flag: "🇱🇸" },
    { name: "Letonia", flag: "🇱🇻" },
    { name: "Líbano", flag: "🇱🇧" },
    { name: "Liberia", flag: "🇱🇷" },
    { name: "Libia", flag: "🇱🇾" },
    { name: "Liechtenstein", flag: "🇱🇮" },
    { name: "Lituania", flag: "🇱🇹" },
    { name: "Luxemburgo", flag: "🇱🇺" },
    { name: "Macedonia del Norte", flag: "🇲🇰" },
    { name: "Madagascar", flag: "🇲🇬" },
    { name: "Malasia", flag: "🇲🇾" },
    { name: "Malaui", flag: "🇲🇼" },
    { name: "Maldivas", flag: "🇲🇻" },
    { name: "Malí", flag: "🇲🇱" },
    { name: "Malta", flag: "🇲🇹" },
    { name: "Marruecos", flag: "🇲🇦" },
    { name: "Mauricio", flag: "🇲🇺" },
    { name: "Mauritania", flag: "🇲🇷" },
    { name: "México", flag: "🇲🇽" },
    { name: "Micronesia", flag: "🇫🇲" },
    { name: "Moldavia", flag: "🇲🇩" },
    { name: "Mónaco", flag: "🇲🇨" },
    { name: "Mongolia", flag: "🇲🇳" },
    { name: "Montenegro", flag: "🇲🇪" },
    { name: "Mozambique", flag: "🇲🇿" },
    { name: "Namibia", flag: "🇳🇦" },
    { name: "Nauru", flag: "🇳🇷" },
    { name: "Nepal", flag: "🇳🇵" },
    { name: "Nicaragua", flag: "🇳🇮" },
    { name: "Níger", flag: "🇳🇪" },
    { name: "Nigeria", flag: "🇳🇬" },
    { name: "Noruega", flag: "🇳🇴" },
    { name: "Nueva Zelanda", flag: "🇳🇿" },
    { name: "Omán", flag: "🇴🇲" },
    { name: "Países Bajos", flag: "🇳🇱" },
    { name: "Pakistán", flag: "🇵🇰" },
    { name: "Palaos", flag: "🇵🇼" },
    { name: "Panamá", flag: "🇵🇦" },
    { name: "Papúa Nueva Guinea", flag: "🇵🇬" },
    { name: "Paraguay", flag: "🇵🇾" },
    { name: "Perú", flag: "🇵🇪" },
    { name: "Polonia", flag: "🇵🇱" },
    { name: "Portugal", flag: "🇵🇹" },
    { name: "Reino Unido", flag: "🇬🇧" },
    { name: "República Centroafricana", flag: "🇨🇫" },
    { name: "República Checa", flag: "🇨🇿" },
    { name: "República del Congo", flag: "🇨🇬" },
    { name: "República Democrática del Congo", flag: "🇨🇩" },
    { name: "República Dominicana", flag: "🇩🇴" },
    { name: "Ruanda", flag: "🇷🇼" },
    { name: "Rumanía", flag: "🇷🇴" },
    { name: "Rusia", flag: "🇷🇺" },
    { name: "Samoa", flag: "🇼🇸" },
    { name: "San Cristóbal y Nieves", flag: "🇰🇳" },
    { name: "San Marino", flag: "🇸🇲" },
    { name: "San Vicente y las Granadinas", flag: "🇻🇨" },
    { name: "Santa Lucía", flag: "🇱🇨" },
    { name: "Santo Tomé y Príncipe", flag: "🇸🇹" },
    { name: "Senegal", flag: "🇸🇳" },
    { name: "Serbia", flag: "🇷🇸" },
    { name: "Seychelles", flag: "🇸🇨" },
    { name: "Sierra Leona", flag: "🇸🇱" },
    { name: "Singapur", flag: "🇸🇬" },
    { name: "Siria", flag: "🇸🇾" },
    { name: "Somalia", flag: "🇸🇴" },
    { name: "Sri Lanka", flag: "🇱🇰" },
    { name: "Suazilandia", flag: "🇸🇿" },
    { name: "Sudáfrica", flag: "🇿🇦" },
    { name: "Sudán", flag: "🇸🇩" },
    { name: "Sudán del Sur", flag: "🇸🇸" },
    { name: "Suecia", flag: "🇸🇪" },
    { name: "Suiza", flag: "🇨🇭" },
    { name: "Surinam", flag: "🇸🇷" },
    { name: "Tailandia", flag: "🇹🇭" },
    { name: "Tanzania", flag: "🇹🇿" },
    { name: "Tayikistán", flag: "🇹🇯" },
    { name: "Timor Oriental", flag: "🇹🇱" },
    { name: "Togo", flag: "🇹🇬" },
    { name: "Tonga", flag: "🇹🇴" },
    { name: "Trinidad y Tobago", flag: "🇹🇹" },
    { name: "Túnez", flag: "🇹🇳" },
    { name: "Turkmenistán", flag: "🇹🇲" },
    { name: "Turquía", flag: "🇹🇷" },
    { name: "Tuvalu", flag: "🇹🇻" },
    { name: "Ucrania", flag: "🇺🇦" },
    { name: "Uganda", flag: "🇺🇬" },
    { name: "Uruguay", flag: "🇺🇾" },
    { name: "Uzbekistán", flag: "🇺🇿" },
    { name: "Vanuatu", flag: "🇻🇺" },
    { name: "Venezuela", flag: "🇻🇪" },
    { name: "Vietnam", flag: "🇻🇳" },
    { name: "Yemen", flag: "🇾🇪" },
    { name: "Yibuti", flag: "🇩🇯" },
    { name: "Zambia", flag: "🇿🇲" },
    { name: "Zimbabue", flag: "🇿🇼" },
  ]

  $: filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  $: selectedCountryObj = countries.find((c) => c.name === value)

  function toggleDropdown() {
    if (disabled) return
    isOpen = !isOpen
    if (isOpen) {
      searchQuery = ""
      // Focus the input in the next tick
      setTimeout(() => {
        const input = dropdownRef?.querySelector("input")
        if (input) input.focus()
      }, 0)
    }
  }

  function selectCountry(countryName: string) {
    value = countryName
    isOpen = false
    searchQuery = ""
    dispatch("change", { value })
  }

  // Cerrar al hacer click fuera
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        isOpen = false
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  })
</script>

<div
  class="custom-dropdown-container {$$props.class || ''}"
  bind:this={dropdownRef}
  {id}
>
  <button
    type="button"
    class="dropdown-trigger"
    class:disabled
    on:click={toggleDropdown}
  >
    {#if selectedCountryObj}
      <span class="country-display">
        <span class="flag">{selectedCountryObj.flag}</span>
        <span class="name">{selectedCountryObj.name}</span>
      </span>
    {:else}
      <span class="placeholder">{placeholder}</span>
    {/if}
    <ChevronDown size={16} class="chevron" />
  </button>

  {#if isOpen}
    <div class="dropdown-menu">
      <div class="search-box">
        <Search size={14} class="search-icon" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Buscar..."
          on:click|stopPropagation
        />
      </div>

      <ul class="options-list">
        {#each filteredCountries as country}
          <li>
            <button
              type="button"
              class="option-btn"
              class:selected={value === country.name}
              on:click={() => selectCountry(country.name)}
            >
              <span class="option-flag">{country.flag}</span>
              <span class="option-name">{country.name}</span>
            </button>
          </li>
        {:else}
          <li class="no-results">No se encontraron países</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .custom-dropdown-container {
    position: relative;
    width: 100%;
    font-family: inherit;
  }

  .dropdown-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f172a;
    border: 1px solid #334155;
    padding: 0.75rem;
    border-radius: 6px;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .dropdown-trigger.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dropdown-trigger:focus-visible {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .country-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .flag {
    font-size: 1.1rem;
    line-height: 1;
  }

  .placeholder {
    color: #94a3b8;
  }

  .chevron {
    color: #64748b;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 100%;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    z-index: 50;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 300px;
  }

  .search-box {
    position: relative;
    padding: 0.5rem;
    border-bottom: 1px solid #334155;
    background: #0f172a;
  }

  .search-icon {
    position: absolute;
    left: 0.8rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }

  .search-box input {
    width: 100%;
    background: #1e293b;
    border: 1px solid #334155;
    padding: 0.4rem 0.4rem 0.4rem 2rem;
    border-radius: 4px;
    color: white;
    font-size: 0.9rem;
  }

  .search-box input:focus {
    outline: none;
    border-color: #6366f1;
  }

  .options-list {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    overflow-y: auto;
    flex: 1;
  }

  .option-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 0.95rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
  }

  .option-btn:hover {
    background: #334155;
  }

  .option-btn.selected {
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
  }

  .option-flag {
    font-size: 1.1rem;
    line-height: 1;
  }

  .no-results {
    padding: 0.75rem;
    color: #94a3b8;
    text-align: center;
    font-size: 0.9rem;
  }

  /* Custom Scrollbar for dropdown */
  .options-list::-webkit-scrollbar {
    width: 6px;
  }
  .options-list::-webkit-scrollbar-track {
    background: #1e293b;
  }
  .options-list::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 3px;
  }
  .options-list::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
</style>
