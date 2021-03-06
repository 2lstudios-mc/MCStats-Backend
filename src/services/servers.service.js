import Server from "../schema/server.schema";

import proxyList from "../data/proxies";
import softwareList from "../data/softwares";
import versionList from "../data/versions";

const results = {
  total: 0,
  totalOnline: 0,
  players: 0,

  byVersions: {},
  byProxies: {},
  byStandalone: {},
};

export function getLists() {
  return {
    softwares: [...proxyList, ...softwareList],
    versions: versionList,
  };
}

function sortJson(json) {
  return Object.keys(json)
    .map((key) => {
      const value = json[key];
      return { name: key, count: value };
    })
    .sort((a, b) => {
      return a.count < b.count ? 1 : -1;
    });
}

async function countByVersions() {
  const servers = await Server.find();
  const versions = {};

  for (let server of servers) {
    if (server.versions?.length == 1) {
      let version = server.versions[0];
      if (versions[version] == null) {
        versions[version] = 1;
      } else {
        versions[version]++;
      }
    }
  }

  return sortJson(versions);
}

async function countByProxies() {
  const servers = await Server.find();
  const softwares = {};

  for (let server of servers) {
    if (proxyList.includes(server.software)) {
      if (softwares[server.software] == null) {
        softwares[server.software] = 1;
      } else {
        softwares[server.software]++;
      }
    }
  }

  return sortJson(softwares);
}

async function countByStandalone() {
  const servers = await Server.find();
  const softwares = {};

  for (let server of servers) {
    if (softwareList.includes(server.software)) {
      if (softwares[server.software] == null) {
        softwares[server.software] = 1;
      } else {
        softwares[server.software]++;
      }
    }
  }

  return sortJson(softwares);
}

async function countPlayers() {
  const servers = await Server.find({ online: true });
  let players = 0;

  for (let server of servers) {
    players += server.players;
  }

  return players;
}

async function countTotal() {
  return await Server.find().countDocuments();
}

async function countOnline() {
  return await Server.find({ online: true }).countDocuments();
}

export async function updateResults() {
  const byVersions = await countByVersions();
  const byProxies = await countByProxies();
  const byStandalone = await countByStandalone();

  const total = await countTotal();
  const totalOnline = await countOnline();
  const players = await countPlayers();

  results.byProxies = byProxies;
  results.byStandalone = byStandalone;
  results.byVersions = byVersions;

  results.total = total;
  results.totalOnline = totalOnline;
  results.players = players;
}

export function getResults() {
  return results;
}

export async function search(filters, page = 0) {
  const filter = {};

  if (filters.software) {
    filter.software = filters.software;
  }

  if (filters.version) {
    filter.versions = { $in: [filters.version] };
  }

  if (filters.motd && filters.motd != "") {
    filter.motd = {
      $regex: filters.motd,
      $options: "i",
    };
  }

  const total = await Server.find(filter).countDocuments();

  const servers = await Server.find(filter)
    .sort({ players: -1 })
    .skip(10 * page)
    .limit(10);

  return { total, servers };
}
