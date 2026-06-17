import { apiService } from './src/services/apiService.js';
apiService.fetchLeetCode('aradhyagupta2108').then(res => console.log('SUCCESS', JSON.stringify(res).slice(0, 500))).catch(err => console.error('ERROR', err));
