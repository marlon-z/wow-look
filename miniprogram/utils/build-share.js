var KEYS=require('./stat-calc').BUILD_SLOT_KEYS,getClassMeta=require('./class-data').getClassMeta;
function valid(v){return typeof v==='number'&&isFinite(v)&&Math.floor(v)===v&&v>0;}
function buildSharePayload(build){
  if(!build||!getClassMeta(build.classKey)||!valid(build.specId)||build.specId>9999||!build.slots||Object.keys(build.slots).some(function(key){return KEYS.indexOf(key)<0;}))return null;
  var parts=['v2',build.classKey,String(build.specId)],count=0,failed=false;
  KEYS.forEach(function(key){var item=build.slots[key];if(!item)return;if(!valid(item.itemId)){failed=true;return;}parts.push(key+':'+item.itemId);});
  KEYS.forEach(function(key){var item=build.slots[key],stats=item&&item.selectedCraftingStats;if(!stats||!stats.length)return;if(stats.length>2||count+stats.length>16){failed=true;return;}var used={},fields=['craft',key];stats.forEach(function(s){if(!s||['crit','haste','mastery','versatility'].indexOf(s.type)<0||used[s.type]||!valid(s.value)||s.value>100000)failed=true;used[s.type]=true;fields.push(s.type,String(s.value));});count+=stats.length;parts.push(fields.join(':'));});
  var payload=parts.join('|');return failed||encodeURIComponent(payload).length>900?null:payload;
}
module.exports={BUILD_SLOT_KEYS:KEYS,buildSharePayload:buildSharePayload};
