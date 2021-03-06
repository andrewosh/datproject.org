var html = require('choo/html')
var header = require('./header')
var footer = require('./footer')

module.exports = function (state, prev, send) {
  return html`
  <div>
  ${header(state, prev, send)}
  <header class="bg-white">
    <div class="container">
      <h1 class="content-title horizontal-rule">About Dat</h1>
    </div>
  </header>

  <section class="section bg-neutral-04">
    <div class="container">
      <h2>
        Dat is a grant-funded, open-source, decentralized data sharing tool for efficiently versioning and syncing changes to data.
      </h2>
    </div>
    <div class="container container--narrow">
      <p>Dat can be used to version data locally, or to share and sync data over the internet. Dat includes an optional peer-to-peer distribution system, meaning that the more widely that a dataset is shared, the faster it is for users to retrieve or sync a copy, and the more redundant that the dataset’s availability becomes.</p>

      <p>By building tools to build and share data pipelines, we aim to bring to data a style of collaboration similar to what Git brings to source code. Dat is designed as a general-purpose tool for any data on the Web, with our main priority being to ensure scientific data can be more easily published and archived. Dat is fully open source and is built using JavaScript, Node.js and Electron.</p>
    </div>
  </section>

  <section class="section bg-white">
    <div class="container">
      <h2>History</h2>
    </div>
    <div class="container container--narrow">
      <p>The first code went into Dat <a href="https://github.com/datproject/dat/commit/e5eda57b53f60b05c0c3d97da90c10cd17dcbe19">on August 17, 2013</a>. The first six months were spent making a prototype (thanks to the <a href="http://www.knightfoundation.org/grants/201346305/">John S. and James L. Knight foundation Prototype Fund</a>), followed by taking Dat beyond the prototype phase and into an alpha release.</p>

      <p>In the spring of 2014 we were able to expand the team working on Dat from one to three people, thanks to <a href="https://blog.datproject.org/2014/03/08/sloan-funding/">support from the Alfred P. Sloan foundation</a>. Sloan’s proposition was that they like the initial Dat prototype, but wanted to see scientific data use cases be treated as top priority. As a result we expanded the scope of the project from its tabular data specific beginnings, and have focused on adding features that will help us work with larger open scientific datasets. Sloan redoubled their support in the spring of 2015, allowing us to continue to fund three positions for another two years.</p>

      <p>In the winter of 2016, the <a href="https://blog.datproject.org/2016/02/01/announcing-publicbits-org/">Knight Foundation provided significant funding to create a registry for Dat-hosted datasets</a>, as well as enabling the project to grow and establish a 501(c)(3) non-profit.</p>
    </div>
  </section>
  ${footer(state, prev, send)}
  </div>
`
}
