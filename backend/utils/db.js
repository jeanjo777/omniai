// OmniAI - Configuration Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Variables Supabase non configurées');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Vérifier la connexion à Supabase
 */
async function checkConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connexion Supabase OK');
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion Supabase:', error.message);
    return false;
  }
}

/**
 * Requête avec gestion d'erreur
 */
async function query(table, operation, options = {}) {
  try {
    let queryBuilder = supabase.from(table);

    switch (operation) {
      case 'select':
        queryBuilder = queryBuilder.select(options.columns || '*');
        if (options.filters) {
          options.filters.forEach(f => {
            queryBuilder = queryBuilder.eq(f.column, f.value);
          });
        }
        if (options.order) {
          queryBuilder = queryBuilder.order(options.order.column, {
            ascending: options.order.ascending
          });
        }
        if (options.limit) {
          queryBuilder = queryBuilder.limit(options.limit);
        }
        break;

      case 'insert':
        queryBuilder = queryBuilder.insert(options.data);
        break;

      case 'update':
        queryBuilder = queryBuilder.update(options.data);
        if (options.match) {
          queryBuilder = queryBuilder.match(options.match);
        }
        break;

      case 'delete':
        if (options.match) {
          queryBuilder = queryBuilder.delete().match(options.match);
        }
        break;
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Erreur DB [${table}/${operation}]:`, error);
    throw error;
  }
}

module.exports = {
  supabase,
  checkConnection,
  query
};
