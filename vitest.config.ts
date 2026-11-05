import {defineConfig} from 'vitest/config';
import ownership from './tests/ownership.json';
const shared=ownership.shared;
export default defineConfig({test:{projects:[
 {test:{name:'shared',include:shared}},
 {test:{name:'ashen',include:ownership.ashen}},
 {test:{name:'companion',include:ownership.companion}},
 {test:{name:'goat',include:ownership.goat}},
 {test:{name:'events',include:ownership.events}},
 {test:{name:'studio',include:ownership.studio}}
]}});
