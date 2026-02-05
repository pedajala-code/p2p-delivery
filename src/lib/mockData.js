// Mock data store — simulates Supabase database in memory
import { DELIVERY_STATUS } from '../constants/theme';

let currentUser = null;
let sessionActive = false;

const users = {};
const deliveries = {};
const courierLocations = {};
const reviews = {};
const idVerifications = {};

// Listeners for real-time simulation
const listeners = {};

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function notifyListeners(table, event, record) {
  const key = table;
  if (listeners[key]) {
    listeners[key].forEach((cb) => cb({ eventType: event, new: record, old: record }));
  }
}

// ============ AUTH ============

export const mockAuth = {
  currentSession: null,

  async signUp({ email, password }) {
    const id = uuid();
    const user = { id, email, created_at: new Date().toISOString() };
    users[id] = {
      id,
      email,
      full_name: null,
      phone: null,
      role: null,
      courier_verified: false,
      stripe_account_id: null,
      push_token: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    currentUser = user;
    sessionActive = true;
    this.currentSession = { user };
    seedDemoData(id);
    return { data: { user, session: { user } }, error: null };
  },

  async signInWithPassword({ email, password }) {
    // Find user by email or auto-create for demo purposes
    let user = Object.values(users).find((u) => u.email === email);
    if (!user) {
      // Auto-create user for easy testing
      const id = uuid();
      user = {
        id,
        email,
        full_name: null,
        phone: null,
        role: null,
        courier_verified: false,
        stripe_account_id: null,
        push_token: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      users[id] = user;
      seedDemoData(id);
    }
    currentUser = { id: user.id, email: user.email };
    sessionActive = true;
    this.currentSession = { user: currentUser };
    return { data: { user: currentUser, session: { user: currentUser } }, error: null };
  },

  async signOut() {
    currentUser = null;
    sessionActive = false;
    this.currentSession = null;
    return { error: null };
  },

  async signInWithOtp({ phone }) {
    return { data: {}, error: null };
  },

  async verifyOtp({ phone, token, type }) {
    if (currentUser && users[currentUser.id]) {
      users[currentUser.id].phone = phone;
    }
    return { data: { user: currentUser, session: { user: currentUser } }, error: null };
  },

  async getSession() {
    if (sessionActive && currentUser) {
      return { data: { session: { user: currentUser } }, error: null };
    }
    return { data: { session: null }, error: null };
  },

  onAuthStateChange(callback) {
    // Call immediately with current state
    setTimeout(() => {
      if (sessionActive && currentUser) {
        callback('SIGNED_IN', { user: currentUser });
      } else {
        callback('SIGNED_OUT', null);
      }
    }, 100);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ============ DATABASE ============

function buildQuery(table) {
  let data = [];
  let filters = [];
  let selectFields = '*';
  let orderField = null;
  let orderAsc = true;
  let singleResult = false;
  let isUpsert = false;
  let upsertOptions = {};
  let isInsert = false;
  let isUpdate = false;
  let isSelect = true;
  let insertData = null;
  let updateData = null;

  function getTable() {
    switch (table) {
      case 'users': return users;
      case 'deliveries': return deliveries;
      case 'courier_locations': return courierLocations;
      case 'reviews': return reviews;
      case 'id_verifications': return idVerifications;
      default: return {};
    }
  }

  const query = {
    select(fields) {
      selectFields = fields;
      // Don't override mutation mode — select after insert/upsert/update
      // just means "return the result"
      if (!isInsert && !isUpsert && !isUpdate) {
        isSelect = true;
      }
      return query;
    },
    insert(record) {
      isInsert = true;
      isSelect = false;
      insertData = record;
      return query;
    },
    update(record) {
      isUpdate = true;
      isSelect = false;
      updateData = record;
      return query;
    },
    upsert(record, options) {
      isUpsert = true;
      isSelect = false;
      insertData = record;
      upsertOptions = options || {};
      return query;
    },
    eq(field, value) {
      filters.push((item) => item[field] === value);
      return query;
    },
    neq(field, value) {
      filters.push((item) => item[field] !== value);
      return query;
    },
    is(field, value) {
      filters.push((item) => item[field] === value);
      return query;
    },
    in(field, values) {
      filters.push((item) => values.includes(item[field]));
      return query;
    },
    or(orString) {
      // Simple OR parsing: "sender_id.eq.xxx,courier_id.eq.xxx"
      const parts = orString.split(',');
      filters.push((item) => {
        return parts.some((part) => {
          const match = part.match(/(\w+)\.eq\.(.+)/);
          if (match) return item[match[1]] === match[2];
          return false;
        });
      });
      return query;
    },
    order(field, opts) {
      orderField = field;
      orderAsc = opts?.ascending !== false;
      return query;
    },
    limit(n) {
      return query;
    },
    single() {
      singleResult = true;
      return query;
    },
    async then(resolve) {
      try {
        const store = getTable();

        if (isInsert && insertData) {
          const id = insertData.id || uuid();
          const record = {
            ...insertData,
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          store[id] = record;
          notifyListeners(table, 'INSERT', record);
          return resolve({ data: record, error: null });
        }

        if (isUpsert && insertData) {
          const conflictField = upsertOptions.onConflict || 'id';
          let existing = Object.values(store).find(
            (item) => item[conflictField] === insertData[conflictField]
          );
          if (existing) {
            Object.assign(existing, insertData, { updated_at: new Date().toISOString() });
            notifyListeners(table, 'UPDATE', existing);
            return resolve({ data: existing, error: null });
          } else {
            const id = insertData.id || uuid();
            const record = {
              ...insertData,
              id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            store[id] = record;
            notifyListeners(table, 'INSERT', record);
            return resolve({ data: record, error: null });
          }
        }

        if (isUpdate && updateData) {
          let items = Object.values(store);
          filters.forEach((f) => { items = items.filter(f); });
          items.forEach((item) => {
            Object.assign(item, updateData, { updated_at: new Date().toISOString() });
            notifyListeners(table, 'UPDATE', item);
          });
          const result = items.length === 1 ? items[0] : items;
          return resolve({ data: result, error: null });
        }

        // SELECT
        let items = Object.values(store);
        filters.forEach((f) => { items = items.filter(f); });

        if (orderField) {
          items.sort((a, b) => {
            const aVal = a[orderField] || '';
            const bVal = b[orderField] || '';
            if (orderAsc) return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
          });
        }

        if (singleResult) {
          if (items.length === 0) {
            return resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
          }
          // Join related data for common patterns
          let item = { ...items[0] };
          if (selectFields.includes('courier:users') && item.courier_id) {
            item.courier = users[item.courier_id] || null;
          }
          if (selectFields.includes('users:user_id') && item.user_id) {
            item.users = users[item.user_id] || null;
          }
          return resolve({ data: item, error: null });
        }

        // Handle joins in select
        if (selectFields.includes('users:user_id')) {
          items = items.map((item) => ({
            ...item,
            users: users[item.user_id] || null,
          }));
        }

        return resolve({ data: items, error: null });
      } catch (err) {
        return resolve({ data: null, error: { message: err.message } });
      }
    },
  };

  return query;
}

// ============ STORAGE ============

const storageFiles = {};

const mockStorage = {
  from(bucket) {
    return {
      upload(path, data, options) {
        const key = `${bucket}/${path}`;
        storageFiles[key] = { data, contentType: options?.contentType || 'image/jpeg' };
        return Promise.resolve({ data: { path }, error: null });
      },
      getPublicUrl(path) {
        return { data: { publicUrl: `https://mock-storage.local/${bucket}/${path}` } };
      },
    };
  },
};

// ============ REALTIME ============

function mockChannel(name) {
  const channelListeners = [];
  const channel = {
    on(type, config, callback) {
      const table = config?.table;
      if (table) {
        if (!listeners[table]) listeners[table] = [];
        listeners[table].push(callback);
        channelListeners.push({ table, callback });
      }
      return channel;
    },
    subscribe() {
      return channel;
    },
  };
  channel._cleanup = () => {
    channelListeners.forEach(({ table, callback }) => {
      if (listeners[table]) {
        listeners[table] = listeners[table].filter((cb) => cb !== callback);
      }
    });
  };
  return channel;
}

// ============ MAIN MOCK SUPABASE ============

export const mockSupabase = {
  auth: mockAuth,
  from: (table) => buildQuery(table),
  storage: mockStorage,
  channel: (name) => mockChannel(name),
  removeChannel: (channel) => {
    if (channel?._cleanup) channel._cleanup();
  },
};

// ============ SEED DEMO DATA ============

export function seedDemoData(userId) {
  // Create some demo deliveries
  const demoDeliveries = [
    {
      id: uuid(),
      sender_id: userId,
      courier_id: null,
      pickup_address: '123 Main Street, Downtown',
      dropoff_address: '456 Oak Avenue, Uptown',
      package_description: 'Small electronics package',
      package_size: 'Small',
      offered_price: 15.00,
      platform_fee: 3.75,
      courier_payout: 11.25,
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: uuid(),
      sender_id: userId,
      courier_id: null,
      pickup_address: '789 Pine Road, Midtown',
      dropoff_address: '321 Elm Street, Westside',
      package_description: 'Birthday gift - fragile',
      package_size: 'Medium',
      offered_price: 22.50,
      platform_fee: 5.63,
      courier_payout: 16.87,
      status: 'pending',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: uuid(),
      sender_id: 'demo-sender-1',
      courier_id: null,
      pickup_address: '555 Broadway, Theater District',
      dropoff_address: '888 Park Ave, Upper East',
      package_description: 'Documents - envelope',
      package_size: 'Small',
      offered_price: 10.00,
      platform_fee: 2.50,
      courier_payout: 7.50,
      status: 'pending',
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: uuid(),
      sender_id: 'demo-sender-2',
      courier_id: null,
      pickup_address: '100 Market Street, Financial District',
      dropoff_address: '200 Mission Street, SoMa',
      package_description: 'Clothing order',
      package_size: 'Large',
      offered_price: 30.00,
      platform_fee: 7.50,
      courier_payout: 22.50,
      status: 'pending',
      created_at: new Date(Date.now() - 900000).toISOString(),
    },
  ];

  demoDeliveries.forEach((d) => {
    deliveries[d.id] = d;
  });

  // Create demo sender users
  users['demo-sender-1'] = {
    id: 'demo-sender-1',
    email: 'alice@example.com',
    full_name: 'Alice Johnson',
    phone: '+1 555-0101',
    role: 'sender',
    courier_verified: false,
    created_at: new Date().toISOString(),
  };
  users['demo-sender-2'] = {
    id: 'demo-sender-2',
    email: 'bob@example.com',
    full_name: 'Bob Smith',
    phone: '+1 555-0102',
    role: 'sender',
    courier_verified: false,
    created_at: new Date().toISOString(),
  };
}
