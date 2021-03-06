# rcon-shell

[<img width="570" alt="rcon-shell-img3" src="https://user-images.githubusercontent.com/8649362/90320437-575c0600-df39-11ea-932d-324b354b457d.png" align="left">](https://github.com/leonardodino/rcon-shell)

[**`rcon`**](https://developer.valvesoftware.com/wiki/Half-Life_Dedicated_Server#Connectivity) interactive shell via `µdp`

## features

:brain:&emsp;**autocompletion**
<br>&emsp;&emsp;<sub>for commands, maps and `cvar`s</sub>

<br>

:clamp:&emsp;**lightweight** + **minimalist**
<br>&emsp;&emsp;<sub>single self-contained file, under `5kb`</sub>
<br>&emsp;&emsp;<sub>no 3<sup>rd</sup> party dependencies</sub>

<br>

:moyai:&emsp;**compatible**
<br>&emsp;&emsp;<sub>supports node `v10+`</sub>
<br>&emsp;&emsp;<sub>can be saved directly to `PATH`</sub>

## installation

<table>
  <thead><tr><th align="left">curl</th></tr></thead>
  <tbody><tr><td align="left">
    <code>curl -sL https://unpkg.com/rcon-shell/bin/rcon-shell > /usr/local/bin/rcon-shell</code>
    <br>
    <code>chmod +x /usr/local/bin/rcon-shell</code>
  </td></tr></tbody>
</table>

<table align="left">
  <thead><tr><th align="left">yarn</th></tr></thead>
  <tbody><tr><td align="left"><code>yarn global add rcon-shell</code></td></tr></tbody>
</table>
<img align="left" width="1rem" height="1rem">
<table align="left">
  <thead><tr><th align="left">npm</th></tr></thead>
  <tbody><tr><td align="left"><code>npm i -g rcon-shell</code></td></tr></tbody>
</table>
<img align="left" width="1rem" height="1rem">
<table>
  <thead><tr><th align="left">npx</th></tr></thead>
  <tbody><tr><td align="left"><code>npx rcon-shell</code></td></tr></tbody>
</table>

## usage

```bash
RCON_HOST=example.org RCON_PASSWORD=your-password-here rcon-shell
```

the cli does not receive arguments.
it is configured via 3 environment variables:

| name            | default     | description                           |
| :-------------- | :---------- | :------------------------------------ |
| `RCON_PASSWORD` | (required)  | `rcon` admin password                 |
| `RCON_HOST`     | `127.0.0.1` | server to connect to (IP or DNS host) |
| `RCON_PORT`     | `27015`     | `udp` port to use for communication   |

**to exit**: <kbd>ctrl + C</kbd> or type `exit`

## system requirements

| [`node`](https://nodejs.org/en/) | [`hlds`](https://developer.valvesoftware.com/wiki/Half-Life_Dedicated_Server) <sub><sup>(or other `rcon`-compatible udp server)</sup></sub> |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| any LTS version after v10        | configured with `rcon_password`                                                                                                             |

## license

[`MIT`](./LICENSE)
