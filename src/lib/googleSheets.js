import Papa from 'papaparse';

// URL del Google Sheet de Papa Chula
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRo9B702Y7KX9SXJ9_tL3tPQhAV5YtNTRZuyB_ihL1fRPLVE7ovRQl6_mbPWxfTL4syVDY3LvRQZhIt/pub?gid=0&single=true&output=csv';

// Mapeo exclusivo de Papa Chula
const CATEGORY_MAP = {
    'HOT DOGS': { id: 'hot-dogs', emoji: '🌭', label: '🌭 HOT DOGS' },
    'PAPAS & TOPPINGS': { id: 'papas-y-toppings', emoji: '🍟', label: '🍟 PAPAS & TOPPINGS' },
};

export async function getMenuData() {
    // Guard: if no Sheet URL is configured, fall back to local menu.json
    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.trim() === '') {
        console.warn('[googleSheets.js] GOOGLE_SHEET_URL no configurada. Usando menu.json local como fallback.');
        try {
            const localMenu = await import('../data/menu.json');
            return localMenu.default || [];
        } catch {
            return [];
        }
    }

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rows = results.data;

                    // 1. Filter by disponible = "TRUE"
                    const activeRows = rows.filter(row => row.disponible === 'TRUE' || row.disponible === 'true');

                    // 2. Group by Category
                    const groupedData = {};

                    activeRows.forEach(row => {
                        const catKey = row.categoria ? row.categoria.trim() : 'Otros';

                        if (!groupedData[catKey]) {
                            const mapData = CATEGORY_MAP[catKey] || {
                                id: catKey.toLowerCase().replace(/\s+/g, '-'),
                                emoji: '🍽️',
                                label: catKey
                            };

                            groupedData[catKey] = {
                                id: mapData.id,
                                category: mapData.label,
                                emoji: mapData.emoji,
                                products: []
                            };
                        }

                        // 3. Map CSV columns to Product Object
                        groupedData[catKey].products.push({
                            id: row.id,
                            nombre: row.nombre,
                            descripcion: row.descripcion,
                            precio: parseInt(row.precio, 10) || 0,
                            imagen: row.imagen && row.imagen.trim() !== '' ? row.imagen : null,
                            badge: row.badge && row.badge.trim() !== '' ? row.badge : null
                        });
                    });

                    // Sort categories by CATEGORY_MAP order, then append unmapped ones
                    const sortedCategories = Object.keys(CATEGORY_MAP)
                        .filter(key => groupedData[key])
                        .map(key => groupedData[key]);

                    Object.keys(groupedData).forEach(key => {
                        if (!CATEGORY_MAP[key]) {
                            sortedCategories.push(groupedData[key]);
                        }
                    });

                    resolve(sortedCategories);
                },
                error: (err) => {
                    reject(err);
                }
            });
        });

    } catch (error) {
        console.error('[googleSheets.js] Error al obtener datos del Sheet:', error);
        return [];
    }
}

