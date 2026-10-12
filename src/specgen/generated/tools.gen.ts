// Code generated from specgen/spec/openapi.yaml by specgen/generator/generate-tools.ts; DO NOT EDIT.

export interface GeneratedToolParam {
  name: string;
  location: 'path' | 'query';
  /** Spec-declared `explode: false`: serialize an array as one comma-joined value. */
  explode?: false;
}

/** MCP tool annotations (tools/list `annotations`): behavioral hints hosts use
 *  to decide what needs human approval. */
export interface ToolAnnotations {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export interface GeneratedTool {
  name: string;
  operationId: string;
  description: string;
  method: string;
  path: string;
  params: GeneratedToolParam[];
  hasBody: boolean;
  annotations: ToolAnnotations;
  inputSchema: Record<string, unknown>;
}

export const generatedTools: GeneratedTool[] = [
  {
    name: 'create-cluster',
    operationId: 'createCluster',
    description:
      "Create an instant cluster (multiple pods with high-speed interconnect). BILLABLE from creation for every pod in the cluster: it rents compute.podCount identical pods at once, each with compute.gpuCountPerPod GPUs of compute.gpuTypeId — state the hourly price for the total GPU count (podCount * gpuCountPerPod, priced from the catalog tools) and create only after the user's explicit go on that quoted shape and total hourly price. Verify GPU stock first via the catalog tools. The compute shape and type are fixed at creation; only the name can be changed later. The container configuration applies to every pod, and templateId is the only private-image path — a bare registry property is rejected. Delete with delete-cluster when finished.",
    method: 'POST',
    path: '/v2/clusters',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreateClusterRequest',
        },
      },
      required: ['body'],
      $defs: {
        BaseContainerConfig: {
          type: 'object',
          properties: {
            args: {
              type: 'string',
              examples: [
                '--model meta-llama/Llama-3-8B --max-model-len 8192',
                '{"entrypoint":["/bin/bash","-c"],"cmd":["python -u main.py"]}',
                '',
              ],
              description:
                'Container command as one string (treated as CMD), or {"entrypoint":[...],"cmd":[...]}.',
            },
            cmd: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [
                ['--model', 'meta-llama/Llama-3-8B', '--max-model-len', '8192'],
              ],
            },
            entrypoint: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['/bin/bash', '-c']],
            },
            disk: {
              type: 'integer',
              minimum: 1,
              examples: [50],
              description: 'Container disk in GB, wiped on restart.',
            },
            env: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              examples: [
                {
                  JUPYTER_PASSWORD: 'hunter2',
                },
              ],
            },
            image: {
              type: 'string',
              examples: ['runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404'],
            },
            ports: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['8888/http', '22/tcp']],
              description:
                'Exposed ports as port/protocol, e.g. 8888/http or 22/tcp.',
            },
          },
        },
        ClusterCompute: {
          type: 'object',
          additionalProperties: false,
          required: ['gpuTypeId', 'gpuCountPerPod', 'podCount'],
          properties: {
            gpuTypeId: {
              type: 'string',
              minLength: 1,
              examples: ['NVIDIA H100 80GB HBM3'],
              description: 'GPU type id from list-gpu-types.',
            },
            gpuCountPerPod: {
              type: 'integer',
              minimum: 1,
              examples: [8],
            },
            podCount: {
              type: 'integer',
              minimum: 2,
              maximum: 250,
              examples: [4],
            },
          },
        },
        ClusterType: {
          type: 'string',
          enum: ['APPLICATION', 'TRAINING', 'SLURM', 'RAY'],
          examples: ['TRAINING'],
        },
        CreateClusterRequest: {
          allOf: [
            {
              $ref: '#/$defs/BaseContainerConfig',
            },
            {
              type: 'object',
              required: ['name', 'type', 'compute'],
              properties: {
                compute: {
                  $ref: '#/$defs/ClusterCompute',
                },
                name: {
                  type: 'string',
                  minLength: 1,
                  examples: ['my-training-cluster'],
                },
                type: {
                  $ref: '#/$defs/ClusterType',
                },
                templateId: {
                  type: 'string',
                  minLength: 1,
                  examples: ['30zmvf89kd'],
                  description:
                    'Pod template for every member pod; the only private-image path. Exclusive with inline container fields.',
                },
                dataCenterIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['US-TX-3'],
                },
                mounts: {
                  $ref: '#/$defs/Mounts',
                },
                startJupyter: {
                  type: 'boolean',
                  default: false,
                },
                startSsh: {
                  type: 'boolean',
                  default: false,
                  description:
                    'Installs your registered SSH keys (update-ssh-keys); does nothing if none are registered.',
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
        Mounts: {
          type: 'object',
          additionalProperties: false,
          properties: {
            persistent: {
              $ref: '#/$defs/PersistentMount',
            },
            network: {
              type: 'array',
              maxItems: 1,
              items: {
                $ref: '#/$defs/NetworkMount',
              },
            },
          },
          description: 'At most one of persistent or network.',
        },
        NetworkMount: {
          type: 'object',
          required: ['volumeId', 'path'],
          additionalProperties: false,
          properties: {
            volumeId: {
              type: 'string',
              examples: ['vol_xyz'],
              description:
                "Network volume id; must be in the pod's data center.",
            },
            path: {
              type: 'string',
              examples: ['/runpod-volume'],
            },
          },
        },
        PersistentMount: {
          type: 'object',
          required: ['size', 'path'],
          additionalProperties: false,
          properties: {
            size: {
              type: 'integer',
              minimum: 10,
              examples: [20],
              description: 'GB, minimum 10.',
            },
            path: {
              type: 'string',
              examples: ['/workspace'],
            },
          },
          description:
            'Host-local storage, lost on host failure. Not allowed on CPU pods.',
        },
      },
    },
  },
  {
    name: 'create-delegation',
    operationId: 'createDelegation',
    description: 'Register an ECR delegation',
    method: 'POST',
    path: '/v2/registries/delegations',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreateDelegationRequest',
        },
      },
      required: ['body'],
      $defs: {
        CreateDelegationRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['resource'],
          properties: {
            resource: {
              type: 'string',
              examples: [
                'arn:aws:ecr:us-east-2:418399314813:repository/runpod/deployment',
              ],
            },
            name: {
              type: ['string', 'null'],
              examples: ['my-delegation'],
            },
          },
        },
      },
    },
  },
  {
    name: 'create-endpoint',
    operationId: 'createEndpoint',
    description:
      "Create a serverless endpoint. BILLABLE: state the worker's hourly price (from the catalog tools) before creating. Worker hardware is one of two choices: the gpu object (gpu.pools takes serverless pool ids from the catalog, e.g. ADA_24, never display names; gpu.count sets GPUs per worker) or the cpu array of CPU flavor configurations for a CPU endpoint. type and scaling are required and fix the request-routing model. Workers cold-start on the first job: expect minutes, poll with get-job-status wait.",
    method: 'POST',
    path: '/v2/serverless',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreateEndpointRequest',
        },
      },
      required: ['body'],
      $defs: {
        BaseContainerConfig: {
          type: 'object',
          properties: {
            args: {
              type: 'string',
              examples: [
                '--model meta-llama/Llama-3-8B --max-model-len 8192',
                '{"entrypoint":["/bin/bash","-c"],"cmd":["python -u main.py"]}',
                '',
              ],
              description:
                'Container command as one string (treated as CMD), or {"entrypoint":[...],"cmd":[...]}.',
            },
            cmd: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [
                ['--model', 'meta-llama/Llama-3-8B', '--max-model-len', '8192'],
              ],
            },
            entrypoint: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['/bin/bash', '-c']],
            },
            disk: {
              type: 'integer',
              minimum: 1,
              examples: [50],
              description: 'Container disk in GB, wiped on restart.',
            },
            env: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              examples: [
                {
                  JUPYTER_PASSWORD: 'hunter2',
                },
              ],
            },
            image: {
              type: 'string',
              examples: ['runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404'],
            },
            ports: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['8888/http', '22/tcp']],
              description:
                'Exposed ports as port/protocol, e.g. 8888/http or 22/tcp.',
            },
          },
        },
        BaseCpuConfig: {
          type: 'object',
          required: ['id', 'vcpuCount'],
          properties: {
            id: {
              type: 'string',
              examples: ['cpu5c'],
              minLength: 1,
              description: 'CPU flavor id from list-cpu-types.',
            },
            vcpuCount: {
              type: 'integer',
              minimum: 2,
              examples: [4],
              description: 'Power of two, valid for the flavor.',
            },
          },
        },
        BaseEndpointGpuConfig: {
          type: 'object',
          properties: {
            pools: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'string',
              },
              examples: [['ADA_24']],
              description:
                'Serverless pool ids from list-gpu-types `pool` (e.g. ADA_24), not GPU type ids.',
            },
            excludedTypes: {
              type: 'array',
              uniqueItems: true,
              items: {
                type: 'string',
                pattern: '^\\s*[^-\\s]',
              },
              examples: [['NVIDIA L40']],
              description:
                'GPU type ids to subtract from pools. On update, sending pools without this clears it.',
            },
            count: {
              type: 'integer',
              minimum: 1,
              default: 1,
              examples: [1],
            },
          },
        },
        ContainerConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseContainerConfig',
            },
            {
              type: 'object',
              properties: {
                registry: {
                  type: ['string', 'null'],
                  examples: [null],
                  description:
                    'Registry credential id for a private image (list-registries).',
                },
              },
            },
          ],
        },
        CreateCpuConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseCpuConfig',
            },
          ],
          unevaluatedProperties: false,
        },
        CreateEndpointGpuConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseEndpointGpuConfig',
            },
            {
              type: 'object',
              required: ['pools'],
              properties: {
                allowedCudaVersions: {
                  type: 'array',
                  items: {
                    type: 'string',
                    pattern: '^\\d+\\.\\d+$',
                  },
                  examples: [['12.8', '12.6']],
                  description:
                    'Exact CUDA versions as major.minor. Exclusive with minCudaVersion.',
                },
                minCudaVersion: {
                  type: 'string',
                  pattern: '^\\d+\\.\\d+$',
                  examples: ['12.1'],
                  description:
                    'CUDA floor as major.minor, compared numerically (12.11 > 12.2). Exclusive with allowedCudaVersions.',
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
        CreateEndpointRequest: {
          allOf: [
            {
              $ref: '#/$defs/ContainerConfig',
            },
            {
              if: {
                not: {
                  required: ['templateId'],
                },
              },
              then: {
                required: ['image'],
              },
            },
            {
              type: 'object',
              required: ['name', 'type', 'scaling'],
              properties: {
                gpu: {
                  $ref: '#/$defs/CreateEndpointGpuConfig',
                },
                name: {
                  type: 'string',
                  minLength: 1,
                  examples: ['my-inference'],
                },
                scaling: {
                  $ref: '#/$defs/EndpointScaling',
                },
                type: {
                  allOf: [
                    {
                      $ref: '#/$defs/EndpointType',
                    },
                  ],
                },
                cpu: {
                  type: 'array',
                  minItems: 1,
                  uniqueItems: true,
                  items: {
                    $ref: '#/$defs/CreateCpuConfig',
                  },
                },
                dataCenterIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                flashboot: {
                  allOf: [
                    {
                      $ref: '#/$defs/FlashBoot',
                    },
                  ],
                  default: 'OFF',
                },
                networkVolumes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                templateId: {
                  type: 'string',
                  minLength: 1,
                  examples: ['30zmvf89kd'],
                  description:
                    'Template id to start from. Body fields override it; env merges per key.',
                },
                timeout: {
                  type: 'integer',
                  default: 300000,
                },
                workers: {
                  allOf: [
                    {
                      $ref: '#/$defs/EndpointWorkers',
                    },
                  ],
                  properties: {
                    min: {
                      type: 'integer',
                      default: 0,
                    },
                    max: {
                      type: 'integer',
                      default: 3,
                    },
                    idleTimeout: {
                      type: 'integer',
                      default: 10,
                    },
                  },
                },
              },
            },
          ],
          unevaluatedProperties: false,
          if: {
            required: ['type'],
            properties: {
              type: {
                const: 'LOAD_BALANCER',
              },
            },
          },
          then: {
            properties: {
              scaling: {
                $ref: '#/$defs/RequestCountScaling',
              },
            },
          },
        },
        EndpointScaling: {
          oneOf: [
            {
              $ref: '#/$defs/QueueDelayScaling',
            },
            {
              $ref: '#/$defs/RequestCountScaling',
            },
          ],
          discriminator: {
            propertyName: 'type',
            mapping: {
              QUEUE_DELAY: '#/$defs/QueueDelayScaling',
              REQUEST_COUNT: '#/$defs/RequestCountScaling',
            },
          },
          description:
            'QUEUE_DELAY (QUEUE endpoints only) or REQUEST_COUNT (required for LOAD_BALANCER).',
        },
        EndpointType: {
          type: 'string',
          'x-enum-varnames': ['EndpointTypeQueue', 'EndpointTypeLoadBalancer'],
          enum: ['QUEUE', 'LOAD_BALANCER'],
          description:
            'QUEUE runs jobs through the queue. LOAD_BALANCER sends HTTP straight to workers (env PORT, PORT_HEALTH, HEALTH_CHECK_PATH).',
        },
        EndpointWorkers: {
          type: 'object',
          additionalProperties: false,
          properties: {
            min: {
              type: 'integer',
              minimum: 0,
              examples: [0],
            },
            max: {
              type: 'integer',
              minimum: 0,
              examples: [5],
            },
            idleTimeout: {
              type: 'integer',
              minimum: 1,
              maximum: 3600,
              examples: [5],
              description:
                'Seconds before idle workers scale down. Rejected for a QUEUE endpoint scaling on REQUEST_COUNT.',
            },
          },
        },
        FlashBoot: {
          type: 'string',
          enum: ['OFF', 'FLASHBOOT', 'PRIORITY_FLASHBOOT'],
        },
        QueueDelayScaling: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'queueDelay'],
          properties: {
            type: {
              type: 'string',
              enum: ['QUEUE_DELAY'],
            },
            queueDelay: {
              type: 'number',
              format: 'float',
              minimum: 0.5,
              examples: [4],
            },
          },
        },
        RequestCountScaling: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'requestCount'],
          properties: {
            type: {
              type: 'string',
              enum: ['REQUEST_COUNT'],
            },
            requestCount: {
              type: 'integer',
              minimum: 1,
              examples: [4],
            },
          },
        },
      },
    },
  },
  {
    name: 'create-network-volume',
    operationId: 'createNetworkVolume',
    description:
      'Create a network volume. Provisions a new network volume — persistent, network-attached storage that can be mounted into pods and serverless workers. Required inputs are `name`, `size` (in GB), and `dataCenter`; an optional `type` selects the storage tier and is immutable after creation. See `CreateNetworkVolumeRequest` for the size bounds and tier options. This creates a billable persistent resource that keeps incurring storage charges until it is deleted. Returns `201` with the created network volume, including its assigned `id`.',
    method: 'POST',
    path: '/v2/network-volumes',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreateNetworkVolumeRequest',
        },
      },
      required: ['body'],
      $defs: {
        CreateNetworkVolumeRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'size', 'dataCenter'],
          properties: {
            dataCenter: {
              type: 'string',
              minLength: 1,
              examples: ['EU-RO-1'],
            },
            name: {
              type: 'string',
              minLength: 1,
              examples: ['my-dataset'],
            },
            size: {
              type: 'integer',
              minimum: 10,
              maximum: 4096,
              examples: [50],
              description: 'GB.',
            },
            type: {
              allOf: [
                {
                  $ref: '#/$defs/VolumeType',
                },
              ],
              description: 'Storage tier; immutable after creation.',
            },
          },
        },
        VolumeType: {
          type: 'string',
          enum: ['STANDARD', 'HIGH_PERFORMANCE'],
        },
      },
    },
  },
  {
    name: 'create-pod',
    operationId: 'createPod',
    description:
      'Rent a GPU/CPU pod. BILLABLE from creation until stop/terminate: state the hourly price before creating. GPU selection is the gpu object: gpu.id takes a catalog GPU type id (e.g. "NVIDIA GeForce RTX 4090"), verified via list-gpu-types, and gpu.count sets the GPU count; cloud/data-center choice constrains stock.',
    method: 'POST',
    path: '/v2/pods',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreatePodRequest',
        },
      },
      required: ['body'],
      $defs: {
        BaseContainerConfig: {
          type: 'object',
          properties: {
            args: {
              type: 'string',
              examples: [
                '--model meta-llama/Llama-3-8B --max-model-len 8192',
                '{"entrypoint":["/bin/bash","-c"],"cmd":["python -u main.py"]}',
                '',
              ],
              description:
                'Container command as one string (treated as CMD), or {"entrypoint":[...],"cmd":[...]}.',
            },
            cmd: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [
                ['--model', 'meta-llama/Llama-3-8B', '--max-model-len', '8192'],
              ],
            },
            entrypoint: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['/bin/bash', '-c']],
            },
            disk: {
              type: 'integer',
              minimum: 1,
              examples: [50],
              description: 'Container disk in GB, wiped on restart.',
            },
            env: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              examples: [
                {
                  JUPYTER_PASSWORD: 'hunter2',
                },
              ],
            },
            image: {
              type: 'string',
              examples: ['runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404'],
            },
            ports: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['8888/http', '22/tcp']],
              description:
                'Exposed ports as port/protocol, e.g. 8888/http or 22/tcp.',
            },
          },
        },
        BaseCpuConfig: {
          type: 'object',
          required: ['id', 'vcpuCount'],
          properties: {
            id: {
              type: 'string',
              examples: ['cpu5c'],
              minLength: 1,
              description: 'CPU flavor id from list-cpu-types.',
            },
            vcpuCount: {
              type: 'integer',
              minimum: 2,
              examples: [4],
              description: 'Power of two, valid for the flavor.',
            },
          },
        },
        BaseGpuConfig: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              examples: ['NVIDIA GeForce RTX 4090'],
              description:
                'GPU type id from list-gpu-types, e.g. "NVIDIA GeForce RTX 4090".',
            },
            count: {
              type: 'integer',
              minimum: 1,
              default: 1,
              examples: [1],
            },
          },
        },
        Cloud: {
          type: 'string',
          enum: ['SECURE', 'COMMUNITY'],
        },
        ContainerConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseContainerConfig',
            },
            {
              type: 'object',
              properties: {
                registry: {
                  type: ['string', 'null'],
                  examples: [null],
                  description:
                    'Registry credential id for a private image (list-registries).',
                },
              },
            },
          ],
        },
        CreateCpuConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseCpuConfig',
            },
          ],
          unevaluatedProperties: false,
        },
        CreateGpuConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseGpuConfig',
            },
            {
              type: 'object',
              properties: {
                allowedCudaVersions: {
                  type: 'array',
                  items: {
                    type: 'string',
                    pattern: '^\\d+\\.\\d+$',
                  },
                  examples: [['12.8', '12.6']],
                  description:
                    'Exact CUDA versions as major.minor. Exclusive with minCudaVersion.',
                },
                minCudaVersion: {
                  type: 'string',
                  pattern: '^\\d+\\.\\d+$',
                  examples: ['12.1'],
                  description:
                    'CUDA floor as major.minor, compared numerically (12.11 > 12.2). Exclusive with allowedCudaVersions.',
                },
                minRamPerGpu: {
                  type: 'integer',
                  minimum: 1,
                  examples: [8],
                },
                minVcpuCountPerGpu: {
                  type: 'integer',
                  minimum: 1,
                  examples: [2],
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
        CreatePodRequest: {
          allOf: [
            {
              $ref: '#/$defs/ContainerConfig',
            },
            {
              type: 'object',
              required: ['name'],
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  examples: ['my-training-pod'],
                },
                cloud: {
                  allOf: [
                    {
                      $ref: '#/$defs/Cloud',
                    },
                  ],
                  default: 'SECURE',
                },
                cpu: {
                  $ref: '#/$defs/CreateCpuConfig',
                },
                dataCenterIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  examples: [['US-TX-3']],
                },
                globalNetworking: {
                  type: 'boolean',
                  default: false,
                  examples: [false],
                  description:
                    'Private IP across data centers. Needs an NVIDIA GPU and an eligible data center (list-data-centers globalNetwork).',
                },
                gpu: {
                  $ref: '#/$defs/CreateGpuConfig',
                },
                mounts: {
                  $ref: '#/$defs/Mounts',
                },
                startJupyter: {
                  type: 'boolean',
                  default: false,
                  examples: [true],
                  description:
                    'Starts JupyterLab; expose 8888/http to reach it.',
                },
                startSsh: {
                  type: 'boolean',
                  default: false,
                  examples: [true],
                  description:
                    'Installs your registered SSH keys (update-ssh-keys); does nothing if none are registered.',
                },
                templateId: {
                  type: 'string',
                  minLength: 1,
                  examples: ['30zmvf89kd'],
                  description:
                    'Template id to start from. Body fields override it; env merges per key.',
                },
              },
            },
          ],
          unevaluatedProperties: false,
          if: {
            not: {
              required: ['templateId'],
            },
          },
          then: {
            required: ['image'],
          },
          description:
            'Exactly one of gpu or cpu. image is required unless templateId is set.',
        },
        Mounts: {
          type: 'object',
          additionalProperties: false,
          properties: {
            persistent: {
              $ref: '#/$defs/PersistentMount',
            },
            network: {
              type: 'array',
              maxItems: 1,
              items: {
                $ref: '#/$defs/NetworkMount',
              },
            },
          },
          description: 'At most one of persistent or network.',
        },
        NetworkMount: {
          type: 'object',
          required: ['volumeId', 'path'],
          additionalProperties: false,
          properties: {
            volumeId: {
              type: 'string',
              examples: ['vol_xyz'],
              description:
                "Network volume id; must be in the pod's data center.",
            },
            path: {
              type: 'string',
              examples: ['/runpod-volume'],
            },
          },
        },
        PersistentMount: {
          type: 'object',
          required: ['size', 'path'],
          additionalProperties: false,
          properties: {
            size: {
              type: 'integer',
              minimum: 10,
              examples: [20],
              description: 'GB, minimum 10.',
            },
            path: {
              type: 'string',
              examples: ['/workspace'],
            },
          },
          description:
            'Host-local storage, lost on host failure. Not allowed on CPU pods.',
        },
      },
    },
  },
  {
    name: 'create-registry',
    operationId: 'createRegistry',
    description:
      'Create a container registry credential. Stores credentials for a private container registry. Credentials are write-only.',
    method: 'POST',
    path: '/v2/registries',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreateRegistryRequest',
        },
      },
      required: ['body'],
      $defs: {
        CreateRegistryRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'username', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 191,
              examples: ['my-private-registry'],
            },
            password: {
              type: 'string',
              minLength: 1,
              maxLength: 16384,
            },
            username: {
              type: 'string',
              minLength: 1,
              maxLength: 191,
            },
          },
        },
      },
    },
  },
  {
    name: 'create-secret',
    operationId: 'createSecret',
    description:
      "Create a secret. Stores a new account-scoped encrypted string. `name` must be unique across the account's secrets and is immutable; `value` is write-only and can never be read back through the API. Use the secret from pods, serverless endpoints, and templates by setting an environment variable's value to `{{ RUNPOD_SECRET_<name> }}` — Runpod substitutes the stored value when the pod or worker boots. Returns `201` with the created secret's metadata, or `409` when the name is already taken.",
    method: 'POST',
    path: '/v2/account/secrets',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreateSecretRequest',
        },
      },
      required: ['body'],
      $defs: {
        CreateSecretRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'value'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 191,
              pattern: '^[a-zA-Z_][a-zA-Z0-9_.\\-/]*$',
              examples: ['hf-token'],
              description:
                'Referenced from env as {{ RUNPOD_SECRET_<name> }}. Immutable; may not start with RUNPOD.',
            },
            value: {
              type: 'string',
              minLength: 1,
              maxLength: 16777216,
              description: 'Write-only; never returned.',
            },
            description: {
              type: 'string',
              maxLength: 65535,
              examples: ['Hugging Face read token'],
            },
          },
        },
      },
    },
  },
  {
    name: 'create-template',
    operationId: 'createTemplate',
    description:
      'Create a template. Creates a reusable container-configuration preset — image, disk, ports, env, registry, and mount settings — for pods and serverless endpoints. Pass its ID as `templateId` to `createPod` or `createEndpoint`, or spread its fields into the request body directly. Returns the created template.',
    method: 'POST',
    path: '/v2/templates',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/CreateTemplateRequest',
        },
      },
      required: ['body'],
      $defs: {
        BaseContainerConfig: {
          type: 'object',
          properties: {
            args: {
              type: 'string',
              examples: [
                '--model meta-llama/Llama-3-8B --max-model-len 8192',
                '{"entrypoint":["/bin/bash","-c"],"cmd":["python -u main.py"]}',
                '',
              ],
              description:
                'Container command as one string (treated as CMD), or {"entrypoint":[...],"cmd":[...]}.',
            },
            cmd: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [
                ['--model', 'meta-llama/Llama-3-8B', '--max-model-len', '8192'],
              ],
            },
            entrypoint: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['/bin/bash', '-c']],
            },
            disk: {
              type: 'integer',
              minimum: 1,
              examples: [50],
              description: 'Container disk in GB, wiped on restart.',
            },
            env: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              examples: [
                {
                  JUPYTER_PASSWORD: 'hunter2',
                },
              ],
            },
            image: {
              type: 'string',
              examples: ['runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404'],
            },
            ports: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['8888/http', '22/tcp']],
              description:
                'Exposed ports as port/protocol, e.g. 8888/http or 22/tcp.',
            },
          },
        },
        ContainerConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseContainerConfig',
            },
            {
              type: 'object',
              properties: {
                registry: {
                  type: ['string', 'null'],
                  examples: [null],
                  description:
                    'Registry credential id for a private image (list-registries).',
                },
              },
            },
          ],
        },
        CreateTemplateRequest: {
          allOf: [
            {
              $ref: '#/$defs/ContainerConfig',
            },
            {
              type: 'object',
              required: ['name', 'image'],
              properties: {
                name: {
                  type: 'string',
                  minLength: 1,
                  examples: ['My PyTorch Template'],
                },
                allowedCudaVersions: {
                  type: 'array',
                  items: {
                    type: 'string',
                    pattern: '^\\d+\\.\\d+$',
                  },
                  examples: [['12.8', '12.6']],
                  description: 'Exact CUDA versions as major.minor.',
                },
                category: {
                  allOf: [
                    {
                      $ref: '#/$defs/TemplateCategory',
                    },
                  ],
                  default: 'NVIDIA',
                },
                mounts: {
                  $ref: '#/$defs/TemplateMounts',
                },
                public: {
                  type: 'boolean',
                  default: false,
                },
                serverless: {
                  type: 'boolean',
                  default: false,
                },
                startJupyter: {
                  type: 'boolean',
                  default: true,
                  examples: [false],
                  description:
                    'Starts JupyterLab; expose 8888/http to reach it.',
                },
                startSsh: {
                  type: 'boolean',
                  default: true,
                  examples: [true],
                  description:
                    'Installs your registered SSH keys (update-ssh-keys); does nothing if none are registered.',
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
        PersistentMount: {
          type: 'object',
          required: ['size', 'path'],
          additionalProperties: false,
          properties: {
            size: {
              type: 'integer',
              minimum: 10,
              examples: [20],
              description: 'GB, minimum 10.',
            },
            path: {
              type: 'string',
              examples: ['/workspace'],
            },
          },
          description:
            'Host-local storage, lost on host failure. Not allowed on CPU pods.',
        },
        TemplateCategory: {
          type: 'string',
          enum: ['CPU', 'NVIDIA', 'AMD'],
        },
        TemplateMounts: {
          type: 'object',
          additionalProperties: false,
          properties: {
            persistent: {
              $ref: '#/$defs/PersistentMount',
            },
          },
          description: 'Persistent only; network is rejected.',
        },
      },
    },
  },
  {
    name: 'delete-cluster',
    operationId: 'deleteCluster',
    description:
      'Delete a cluster permanently: it terminates every member pod. Verify the id with get-cluster, and list-cluster-pods for what the delete takes down, before deleting; delete only clusters your own tool calls created in this conversation, or the one the user asked you to delete by id — a name found by listing is not attribution.',
    method: 'DELETE',
    path: '/v2/clusters/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete-endpoint',
    operationId: 'deleteEndpoint',
    description:
      'Delete a serverless endpoint permanently and immediately. Verify the id belongs to the intended endpoint (get-endpoint) before deleting; delete only endpoints your own tool calls created in this conversation, or the one the user asked you to delete by id — a name found by listing is not attribution.',
    method: 'DELETE',
    path: '/v2/serverless/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete-network-volume',
    operationId: 'deleteNetworkVolume',
    description:
      'Delete a network volume. Permanently deletes a network volume and releases its storage.',
    method: 'DELETE',
    path: '/v2/network-volumes/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete-pod',
    operationId: 'deletePod',
    description:
      'Terminate a pod permanently — its container disk is lost. Distinguish from stopping (pod-action stop) which releases the GPU but keeps volume data. Verify the id with get-pod first; terminate only pods your own tool calls created in this conversation, or the one the user asked you to terminate by id — a name found by listing is not attribution.',
    method: 'DELETE',
    path: '/v2/pods/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete-registry',
    operationId: 'deleteRegistry',
    description:
      'Delete a container registry credential. Permanently deletes a container registry credential by ID. Rejected if any pod currently uses this credential to pull its image. Templates that reference it are not part of that check — they silently lose the reference (`registry` becomes null) instead of blocking the delete.',
    method: 'DELETE',
    path: '/v2/registries/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete-secret',
    operationId: 'deleteSecret',
    description:
      'Delete a secret permanently. Environment variables referencing its name ({{ RUNPOD_SECRET_<name> }}) stop resolving at the next pod or worker boot; running instances keep the value they started with. Verify the id with get-secret first; delete only secrets your own tool calls created in this conversation, or the one the user asked you to delete by id — a name found by listing is not attribution.',
    method: 'DELETE',
    path: '/v2/account/secrets/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete-template',
    operationId: 'deleteTemplate',
    description:
      'Delete a template permanently. Verify with get-template first; a template referenced by a live endpoint should not be deleted.',
    method: 'DELETE',
    path: '/v2/templates/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get-cluster',
    operationId: 'getCluster',
    description:
      'Get a cluster. Returns a single cluster by ID. The pods field is an aggregate summary (total + count by status); fetch the member pods themselves from /v2/clusters/{id}/pods.',
    method: 'GET',
    path: '/v2/clusters/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get-cpu-type',
    operationId: 'getCpuType',
    description:
      'Get a CPU type. Returns a single CPU type with pricing. Availability details are included only when requested with include=AVAILABILITY, which requires `product` — stock differs by product context.',
    method: 'GET',
    path: '/v2/catalog/cpus/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
      {
        name: 'include',
        location: 'query',
        explode: false,
      },
      {
        name: 'product',
        location: 'query',
        explode: false,
      },
      {
        name: 'vcpuCount',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        include: {
          type: 'array',
          maxItems: 1,
          items: {
            $ref: '#/$defs/CatalogInclude',
          },
        },
        product: {
          type: 'array',
          items: {
            $ref: '#/$defs/CpuProduct',
          },
          example: ['POD', 'SERVERLESS'],
          description:
            'Required with include=AVAILABILITY, rejected without it.',
        },
        vcpuCount: {
          type: 'integer',
          minimum: 2,
          description: 'Power of two. Needs include=AVAILABILITY.',
        },
      },
      required: ['id'],
      $defs: {
        CatalogInclude: {
          type: 'string',
          enum: ['AVAILABILITY'],
        },
        CpuProduct: {
          type: 'string',
          enum: ['POD', 'SERVERLESS'],
        },
      },
    },
  },
  {
    name: 'get-data-center',
    operationId: 'getDataCenter',
    description:
      'Get a data center. Returns a single data center. Availability is included only when requested with include=GPU_AVAILABILITY or include=CPU_AVAILABILITY.',
    method: 'GET',
    path: '/v2/catalog/datacenters/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
      {
        name: 'include',
        location: 'query',
        explode: false,
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        include: {
          type: 'array',
          items: {
            $ref: '#/$defs/DataCenterInclude',
          },
          example: ['GPU_AVAILABILITY'],
        },
      },
      required: ['id'],
      $defs: {
        DataCenterInclude: {
          type: 'string',
          enum: ['GPU_AVAILABILITY', 'CPU_AVAILABILITY'],
        },
      },
    },
  },
  {
    name: 'get-endpoint',
    operationId: 'getEndpoint',
    description:
      'Get a serverless endpoint. Returns a single serverless endpoint by ID.',
    method: 'GET',
    path: '/v2/serverless/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get-endpoint-build',
    operationId: 'getEndpointBuild',
    description:
      "Get a serverless endpoint build. Returns one of the endpoint's GitHub builds by id, regardless of age — no need to page through `GET /v2/serverless/{id}/builds` to reach it.",
    method: 'GET',
    path: '/v2/serverless/{id}/builds/{buildId}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
      {
        name: 'buildId',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        buildId: {
          type: 'string',
          description: 'From list-endpoint-builds.',
        },
      },
      required: ['id', 'buildId'],
    },
  },
  {
    name: 'get-gpu-type',
    operationId: 'getGpuType',
    description:
      'Get a GPU type. Returns a single GPU type with pricing. Availability details are included only when requested with include=AVAILABILITY, which requires `product` — stock differs by product context.',
    method: 'GET',
    path: '/v2/catalog/gpus/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
      {
        name: 'include',
        location: 'query',
        explode: false,
      },
      {
        name: 'product',
        location: 'query',
        explode: false,
      },
      {
        name: 'count',
        location: 'query',
      },
      {
        name: 'cloud',
        location: 'query',
      },
      {
        name: 'countryCodes',
        location: 'query',
        explode: false,
      },
      {
        name: 'cudaVersions',
        location: 'query',
        explode: false,
      },
      {
        name: 'minCudaVersion',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        include: {
          type: 'array',
          maxItems: 1,
          items: {
            $ref: '#/$defs/CatalogInclude',
          },
        },
        product: {
          type: 'array',
          items: {
            $ref: '#/$defs/Product',
          },
          description:
            'Required with include=AVAILABILITY, rejected without it.',
        },
        count: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Needs include=AVAILABILITY.',
        },
        cloud: {
          $ref: '#/$defs/GpuCloudFilter',
          description: 'Needs include=AVAILABILITY.',
        },
        countryCodes: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[A-Z]{2}$',
          },
          description:
            'Uppercase ISO country codes, e.g. FR,DE. Needs include=AVAILABILITY.',
        },
        cudaVersions: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^\\d+\\.\\d+$',
          },
          description:
            'Exact major.minor versions. Needs include=AVAILABILITY.',
        },
        minCudaVersion: {
          type: 'string',
          pattern: '^\\d+(\\.\\d+)?$',
          description:
            'CUDA floor, e.g. 12 or 12.1. Needs include=AVAILABILITY.',
        },
      },
      required: ['id'],
      $defs: {
        CatalogInclude: {
          type: 'string',
          enum: ['AVAILABILITY'],
        },
        GpuCloudFilter: {
          type: 'string',
          enum: ['SECURE', 'COMMUNITY'],
        },
        Product: {
          type: 'string',
          enum: ['POD', 'CLUSTER', 'SERVERLESS'],
        },
      },
    },
  },
  {
    name: 'get-network-volume',
    operationId: 'getNetworkVolume',
    description: 'Get a network volume. Returns a single network volume by ID.',
    method: 'GET',
    path: '/v2/network-volumes/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get-pod',
    operationId: 'getPod',
    description: 'Get a pod. Returns a single pod by ID.',
    method: 'GET',
    path: '/v2/pods/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get-registry',
    operationId: 'getRegistry',
    description:
      'Get a container registry credential. Returns a single container registry credential by ID. `username` and `password` are never included in the response — credentials are write-only, matching `createRegistry`.',
    method: 'GET',
    path: '/v2/registries/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get-secret',
    operationId: 'getSecret',
    description:
      "Get a secret. Returns a single secret's metadata by ID. The value is write-only and never returned.",
    method: 'GET',
    path: '/v2/account/secrets/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'get-ssh-keys',
    operationId: 'getSshKeys',
    description:
      "List registered SSH public keys. Returns the account's registered SSH public keys — the keys provisioned into pods created with `startSsh` and used to authenticate the SSH connections reported in a pod's `ssh` block.",
    method: 'GET',
    path: '/v2/account/ssh-keys',
    params: [],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get-template',
    operationId: 'getTemplate',
    description:
      'Get a template. Returns the full configuration of a single template by ID. Serves both templates you own and public catalog templates — everything you can read. Updates and deletes remain restricted to templates you own.',
    method: 'GET',
    path: '/v2/templates/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list-billing',
    operationId: 'listBilling',
    description:
      "Get aggregated billing history. Returns time-bucketed total spend across all billable Runpod resources for the authenticated user. Use startTime/endTime with bucketSize for an explicit range, or lastN with bucketSize for the most recent buckets. Each record reports one bucket's total plus pod, serverless, storage, public endpoint, and Instant Cluster cost components. The metadata block echoes the resolved query window, record count, and totals across all returned buckets.",
    method: 'GET',
    path: '/v2/billing',
    params: [
      {
        name: 'startTime',
        location: 'query',
      },
      {
        name: 'endTime',
        location: 'query',
      },
      {
        name: 'bucketSize',
        location: 'query',
      },
      {
        name: 'lastN',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339. Defaults to 30 days ago.',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339, exclusive. Defaults to now.',
        },
        bucketSize: {
          $ref: '#/$defs/BillingBucketSize',
        },
        lastN: {
          type: 'integer',
          minimum: 1,
          description:
            'Last N buckets ending now. Exclusive with startTime/endTime.',
        },
      },
      $defs: {
        BillingBucketSize: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          'x-enum-varnames': [
            'BillingBucketSizeHour',
            'BillingBucketSizeDay',
            'BillingBucketSizeWeek',
            'BillingBucketSizeMonth',
            'BillingBucketSizeYear',
          ],
          default: 'day',
          examples: ['day'],
        },
      },
    },
  },
  {
    name: 'list-cluster-billing',
    operationId: 'listClusterBilling',
    description:
      'Get cluster billing history. Returns Cluster billing history for the authenticated user, split into time buckets by startTime/endTime with bucketSize or by lastN recent buckets. Use clusterId to filter to one cluster; without it, records are emitted per cluster per bucket. Each record includes GPU compute, disk, inter-node networking, and total amounts. Clusters are GPU-only, so no CPU cost component is returned.',
    method: 'GET',
    path: '/v2/billing/clusters',
    params: [
      {
        name: 'startTime',
        location: 'query',
      },
      {
        name: 'endTime',
        location: 'query',
      },
      {
        name: 'bucketSize',
        location: 'query',
      },
      {
        name: 'lastN',
        location: 'query',
      },
      {
        name: 'clusterId',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339. Defaults to 30 days ago.',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339, exclusive. Defaults to now.',
        },
        bucketSize: {
          $ref: '#/$defs/BillingBucketSize',
        },
        lastN: {
          type: 'integer',
          minimum: 1,
          description:
            'Last N buckets ending now. Exclusive with startTime/endTime.',
        },
        clusterId: {
          type: 'string',
        },
      },
      $defs: {
        BillingBucketSize: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          'x-enum-varnames': [
            'BillingBucketSizeHour',
            'BillingBucketSizeDay',
            'BillingBucketSizeWeek',
            'BillingBucketSizeMonth',
            'BillingBucketSizeYear',
          ],
          default: 'day',
          examples: ['day'],
        },
      },
    },
  },
  {
    name: 'list-cluster-pods',
    operationId: 'listClusterPods',
    description:
      "List a cluster's pods. Returns the full member pods of a cluster. The cluster summary (`GET /v2/clusters/{id}`) carries only aggregate pod counts; this endpoint returns each member as a complete Pod object.",
    method: 'GET',
    path: '/v2/clusters/{id}/pods',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list-clusters',
    operationId: 'listClusters',
    description:
      'List clusters. Returns all clusters owned by the authenticated user.',
    method: 'GET',
    path: '/v2/clusters',
    params: [],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list-cpu-types',
    operationId: 'listCpuTypes',
    description:
      'List CPU types. Returns available CPU flavors. Availability is included only when requested with include=AVAILABILITY, which requires `product` — stock differs by product context.',
    method: 'GET',
    path: '/v2/catalog/cpus',
    params: [
      {
        name: 'include',
        location: 'query',
        explode: false,
      },
      {
        name: 'product',
        location: 'query',
        explode: false,
      },
      {
        name: 'vcpuCount',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        include: {
          type: 'array',
          maxItems: 1,
          items: {
            $ref: '#/$defs/CatalogInclude',
          },
        },
        product: {
          type: 'array',
          items: {
            $ref: '#/$defs/CpuProduct',
          },
          example: ['POD', 'SERVERLESS'],
          description:
            'Required with include=AVAILABILITY, rejected without it.',
        },
        vcpuCount: {
          type: 'integer',
          minimum: 2,
          description: 'Power of two. Needs include=AVAILABILITY.',
        },
      },
      $defs: {
        CatalogInclude: {
          type: 'string',
          enum: ['AVAILABILITY'],
        },
        CpuProduct: {
          type: 'string',
          enum: ['POD', 'SERVERLESS'],
        },
      },
    },
  },
  {
    name: 'list-data-centers',
    operationId: 'listDataCenters',
    description:
      'List data centers. Returns available data center locations with region, compliance, supported network volume tiers, and global networking support. Use include=GPU_AVAILABILITY or include=CPU_AVAILABILITY to add per-resource availability arrays to each data center. The regions, networkVolumeTypes, compliance, and globalNetwork query parameters filter the list before it is returned.',
    method: 'GET',
    path: '/v2/catalog/datacenters',
    params: [
      {
        name: 'include',
        location: 'query',
        explode: false,
      },
      {
        name: 'regions',
        location: 'query',
        explode: false,
      },
      {
        name: 'networkVolumeTypes',
        location: 'query',
        explode: false,
      },
      {
        name: 'compliance',
        location: 'query',
        explode: false,
      },
      {
        name: 'globalNetwork',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        include: {
          type: 'array',
          items: {
            $ref: '#/$defs/DataCenterInclude',
          },
          example: ['GPU_AVAILABILITY'],
        },
        regions: {
          type: 'array',
          items: {
            $ref: '#/$defs/DataCenterRegion',
          },
          example: ['EUROPE', 'ASIA'],
        },
        networkVolumeTypes: {
          type: 'array',
          items: {
            $ref: '#/$defs/VolumeType',
          },
          example: ['STANDARD', 'HIGH_PERFORMANCE'],
        },
        compliance: {
          type: 'array',
          items: {
            $ref: '#/$defs/Compliance',
          },
          example: ['GDPR', 'SOC_2_TYPE_2'],
        },
        globalNetwork: {
          type: 'boolean',
        },
      },
      $defs: {
        Compliance: {
          type: 'string',
          enum: [
            'GDPR',
            'ISO_IEC_27001',
            'ISO_14001',
            'PCI_DSS',
            'HITRUST',
            'SOC_1_TYPE_2',
            'SOC_2_TYPE_2',
            'SOC_3_TYPE_2',
            'ITAR',
            'FISMA_HIGH',
            'HIPAA',
            'RENEWABLE',
          ],
        },
        DataCenterInclude: {
          type: 'string',
          enum: ['GPU_AVAILABILITY', 'CPU_AVAILABILITY'],
        },
        DataCenterRegion: {
          type: 'string',
          examples: ['EUROPE'],
          enum: [
            'NORTH_AMERICA',
            'SOUTH_AMERICA',
            'EUROPE',
            'ASIA',
            'MIDDLE_EAST',
            'AFRICA',
            'OCEANIA',
            'ANTARCTICA',
            'UNKNOWN',
          ],
        },
        VolumeType: {
          type: 'string',
          enum: ['STANDARD', 'HIGH_PERFORMANCE'],
        },
      },
    },
  },
  {
    name: 'list-delegations',
    operationId: 'listDelegations',
    description: 'List all ECR delegations',
    method: 'GET',
    path: '/v2/registries/delegations',
    params: [],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list-endpoint-billing',
    operationId: 'listEndpointBilling',
    description:
      'Get public endpoint billing history. Returns Runpod public endpoint billing history for the authenticated user, split into time buckets by startTime/endTime with bucketSize or by lastN recent buckets. Each record reports the endpoint total for one bucket, and metadata echoes the resolved query window, record count, and total endpoint amount across all returned records.',
    method: 'GET',
    path: '/v2/billing/endpoints',
    params: [
      {
        name: 'startTime',
        location: 'query',
      },
      {
        name: 'endTime',
        location: 'query',
      },
      {
        name: 'bucketSize',
        location: 'query',
      },
      {
        name: 'lastN',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339. Defaults to 30 days ago.',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339, exclusive. Defaults to now.',
        },
        bucketSize: {
          $ref: '#/$defs/BillingBucketSize',
        },
        lastN: {
          type: 'integer',
          minimum: 1,
          description:
            'Last N buckets ending now. Exclusive with startTime/endTime.',
        },
      },
      $defs: {
        BillingBucketSize: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          'x-enum-varnames': [
            'BillingBucketSizeHour',
            'BillingBucketSizeDay',
            'BillingBucketSizeWeek',
            'BillingBucketSizeMonth',
            'BillingBucketSizeYear',
          ],
          default: 'day',
          examples: ['day'],
        },
      },
    },
  },
  {
    name: 'list-endpoint-builds',
    operationId: 'listEndpointBuilds',
    description:
      "List serverless endpoint builds. Returns the endpoint's GitHub build history, newest first (Runpod GitHub-build integration), cursor-paginated; an omitted `limit` defaults to 100, so a bare request returns at most the 100 most recent builds. Any build can also be fetched by id via `GET /v2/serverless/{id}/builds/{buildId}`. Stream a build's logs via `/v2/serverless/{id}/builds/{buildId}/logs`.",
    method: 'GET',
    path: '/v2/serverless/{id}/builds',
    params: [
      {
        name: 'id',
        location: 'path',
      },
      {
        name: 'cursor',
        location: 'query',
      },
      {
        name: 'limit',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        cursor: {
          type: 'string',
          minLength: 1,
          description: "The previous response's pagination.nextCursor.",
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list-endpoint-releases',
    operationId: 'listEndpointReleases',
    description:
      "List serverless endpoint releases. Returns the endpoint's release history (newest first) plus a rollout summary of how many workers are running the current version. Each release is a versioned configuration snapshot with a `diff` of what changed; build-driven releases carry a `buildId` (fetch build detail via the builds sub-routes). Releases are cursor-paginated newest-first; an omitted `limit` defaults to 1000. The rollout summary always describes the endpoint's current state, independent of the page requested.",
    method: 'GET',
    path: '/v2/serverless/{id}/releases',
    params: [
      {
        name: 'id',
        location: 'path',
      },
      {
        name: 'cursor',
        location: 'query',
      },
      {
        name: 'limit',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        cursor: {
          type: 'string',
          minLength: 1,
          description: "The previous response's pagination.nextCursor.",
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list-endpoint-workers',
    operationId: 'listEndpointWorkers',
    description:
      "List serverless endpoint workers. Lists the active workers for a serverless endpoint. **Returns.** A `200` with a `ListEndpointWorkersResponse`: a `workers` array (one entry per active worker, each carrying its `id`, `status`, and runtime details) plus a `summary` of worker counts grouped by status. Only currently active workers are included; scaled-down workers are not returned. **How `status` is determined.** Each worker's `status` is derived by reconciling the worker pod's lifecycle status with the endpoint's live job-queue view (which workers are actively serving requests). When the job-queue view is unavailable, the response degrades gracefully: the shape is unchanged, but each `status` and the summary counts fall back to pod lifecycle alone.",
    method: 'GET',
    path: '/v2/serverless/{id}/workers',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list-gpu-types',
    operationId: 'listGpuTypes',
    description:
      'List GPU types. Returns available GPU types with pricing. Availability is included only when requested with include=AVAILABILITY, which requires `product` — stock differs by product context. With countryCodes, the list is narrowed to GPU types deployable in those countries, so "this geography + this chip" resolves in one read.',
    method: 'GET',
    path: '/v2/catalog/gpus',
    params: [
      {
        name: 'include',
        location: 'query',
        explode: false,
      },
      {
        name: 'product',
        location: 'query',
        explode: false,
      },
      {
        name: 'count',
        location: 'query',
      },
      {
        name: 'cloud',
        location: 'query',
      },
      {
        name: 'countryCodes',
        location: 'query',
        explode: false,
      },
      {
        name: 'cudaVersions',
        location: 'query',
        explode: false,
      },
      {
        name: 'minCudaVersion',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        include: {
          type: 'array',
          maxItems: 1,
          items: {
            $ref: '#/$defs/CatalogInclude',
          },
        },
        product: {
          type: 'array',
          items: {
            $ref: '#/$defs/Product',
          },
          description:
            'Required with include=AVAILABILITY, rejected without it.',
        },
        count: {
          type: 'integer',
          minimum: 1,
          default: 1,
          description: 'Needs include=AVAILABILITY.',
        },
        cloud: {
          $ref: '#/$defs/GpuCloudFilter',
          description: 'Needs include=AVAILABILITY.',
        },
        countryCodes: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^[A-Z]{2}$',
          },
          description:
            'Uppercase ISO country codes, e.g. FR,DE. Needs include=AVAILABILITY.',
        },
        cudaVersions: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^\\d+\\.\\d+$',
          },
          description:
            'Exact major.minor versions. Needs include=AVAILABILITY.',
        },
        minCudaVersion: {
          type: 'string',
          pattern: '^\\d+(\\.\\d+)?$',
          description:
            'CUDA floor, e.g. 12 or 12.1. Needs include=AVAILABILITY.',
        },
      },
      $defs: {
        CatalogInclude: {
          type: 'string',
          enum: ['AVAILABILITY'],
        },
        GpuCloudFilter: {
          type: 'string',
          enum: ['SECURE', 'COMMUNITY'],
        },
        Product: {
          type: 'string',
          enum: ['POD', 'CLUSTER', 'SERVERLESS'],
        },
      },
    },
  },
  {
    name: 'list-network-volume-billing',
    operationId: 'listNetworkVolumeBilling',
    description:
      'Get network volume billing history. Returns network volume billing history for the authenticated user, split into time buckets by startTime/endTime with bucketSize or by lastN recent buckets. Use networkVolumeId to filter to one volume; without it, records are emitted per volume per bucket. Each record includes standard storage, high-performance storage, and total amounts, while metadata reports the resolved query, distinct volume count, and totals across the returned records.',
    method: 'GET',
    path: '/v2/billing/network-volumes',
    params: [
      {
        name: 'startTime',
        location: 'query',
      },
      {
        name: 'endTime',
        location: 'query',
      },
      {
        name: 'bucketSize',
        location: 'query',
      },
      {
        name: 'lastN',
        location: 'query',
      },
      {
        name: 'networkVolumeId',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339. Defaults to 30 days ago.',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339, exclusive. Defaults to now.',
        },
        bucketSize: {
          $ref: '#/$defs/BillingBucketSize',
        },
        lastN: {
          type: 'integer',
          minimum: 1,
          description:
            'Last N buckets ending now. Exclusive with startTime/endTime.',
        },
        networkVolumeId: {
          type: 'string',
        },
      },
      $defs: {
        BillingBucketSize: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          'x-enum-varnames': [
            'BillingBucketSizeHour',
            'BillingBucketSizeDay',
            'BillingBucketSizeWeek',
            'BillingBucketSizeMonth',
            'BillingBucketSizeYear',
          ],
          default: 'day',
          examples: ['day'],
        },
      },
    },
  },
  {
    name: 'list-network-volumes',
    operationId: 'listNetworkVolumes',
    description:
      'List network volumes. Returns all network volumes owned by the authenticated user.',
    method: 'GET',
    path: '/v2/network-volumes',
    params: [],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list-pod-billing',
    operationId: 'listPodBilling',
    description:
      'Get pod billing history. Returns pod-only billing detail for the authenticated user, split into time buckets by startTime/endTime with bucketSize or by lastN recent buckets. Use podId to narrow the response to one GPU or CPU pod; without it, records are emitted per pod per bucket. Each record includes podId, GPU, CPU, disk, and total amounts, while metadata echoes the resolved query and totals across the pod records. Use listBilling when you need aggregate spend across every billable resource family.',
    method: 'GET',
    path: '/v2/billing/pods',
    params: [
      {
        name: 'startTime',
        location: 'query',
      },
      {
        name: 'endTime',
        location: 'query',
      },
      {
        name: 'bucketSize',
        location: 'query',
      },
      {
        name: 'lastN',
        location: 'query',
      },
      {
        name: 'podId',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339. Defaults to 30 days ago.',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339, exclusive. Defaults to now.',
        },
        bucketSize: {
          $ref: '#/$defs/BillingBucketSize',
        },
        lastN: {
          type: 'integer',
          minimum: 1,
          description:
            'Last N buckets ending now. Exclusive with startTime/endTime.',
        },
        podId: {
          type: 'string',
        },
      },
      $defs: {
        BillingBucketSize: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          'x-enum-varnames': [
            'BillingBucketSizeHour',
            'BillingBucketSizeDay',
            'BillingBucketSizeWeek',
            'BillingBucketSizeMonth',
            'BillingBucketSizeYear',
          ],
          default: 'day',
          examples: ['day'],
        },
      },
    },
  },
  {
    name: 'list-pods',
    operationId: 'listPods',
    description:
      'List pods. Returns pods owned by the authenticated user. Cluster member pods are excluded by default; set `includeClusterPods=true` to include them (each carries a non-null `cluster` membership block). Results are cursor-paginated newest-first; an omitted `limit` defaults to 1000. When cluster member pods are excluded, the exclusion applies to each page after it is cut, so a page may hold fewer than `limit` pods — follow `pagination.nextCursor` until `hasNextPage` is false rather than counting items.',
    method: 'GET',
    path: '/v2/pods',
    params: [
      {
        name: 'includeClusterPods',
        location: 'query',
      },
      {
        name: 'cursor',
        location: 'query',
      },
      {
        name: 'limit',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        includeClusterPods: {
          type: 'boolean',
          default: false,
        },
        cursor: {
          type: 'string',
          minLength: 1,
          description: "The previous response's pagination.nextCursor.",
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 1000,
        },
      },
    },
  },
  {
    name: 'list-public-templates',
    operationId: 'listPublicTemplates',
    description:
      "List public templates. Returns the public template catalog. `source` selects which slice: `official` (the default) is Runpod-curated templates, `verified` is community templates Runpod has verified, and `community` is everything else other users have shared publicly. Both pod and serverless templates appear — use each entry's `serverless` flag to tell them apart. `registry` is always null for templates you don't own. Your own templates (public or private) are managed under `/v2/templates`; fetch any individual template — catalog or owned — via `/v2/templates/{id}`. At most 100 templates are returned. Cursor pagination is not yet supported here; `pagination` is always the exhausted marker (`nextCursor: null`, `hasNextPage: false`).",
    method: 'GET',
    path: '/v2/catalog/templates',
    params: [
      {
        name: 'source',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['official', 'verified', 'community'],
          default: 'official',
        },
      },
    },
  },
  {
    name: 'list-registries',
    operationId: 'listRegistries',
    description:
      'List container registries. Returns all container registry credentials owned by the authenticated user.',
    method: 'GET',
    path: '/v2/registries',
    params: [],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list-secrets',
    operationId: 'listSecrets',
    description:
      "List secrets. Returns the account's secrets — encrypted strings referenced from pod, serverless, and template environment variables with the `{{ RUNPOD_SECRET_<name> }}` placeholder syntax, substituted with the secret's value when the pod or worker boots. Secret values are write-only and are never returned.",
    method: 'GET',
    path: '/v2/account/secrets',
    params: [
      {
        name: 'name',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    },
  },
  {
    name: 'list-serverless-billing',
    operationId: 'listServerlessBilling',
    description:
      'Get serverless billing history, split into time buckets. SIZE WARNING: with defaults this emits one record per endpoint PER BUCKET — on an account with many endpoints the response overflows the tool-result limit and becomes unusable. Always pass lastN: 1 (or a bucketSize spanning the whole window) for one record per endpoint, and serverlessId when you need one endpoint. Distinct from pod billing, which covers standalone pods.',
    method: 'GET',
    path: '/v2/billing/serverless',
    params: [
      {
        name: 'startTime',
        location: 'query',
      },
      {
        name: 'endTime',
        location: 'query',
      },
      {
        name: 'bucketSize',
        location: 'query',
      },
      {
        name: 'lastN',
        location: 'query',
      },
      {
        name: 'serverlessId',
        location: 'query',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339. Defaults to 30 days ago.',
        },
        endTime: {
          type: 'string',
          format: 'date-time',
          description: 'RFC 3339, exclusive. Defaults to now.',
        },
        bucketSize: {
          $ref: '#/$defs/BillingBucketSize',
        },
        lastN: {
          type: 'integer',
          minimum: 1,
          description:
            'Last N buckets ending now. Exclusive with startTime/endTime.',
        },
        serverlessId: {
          type: 'string',
        },
      },
      $defs: {
        BillingBucketSize: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          'x-enum-varnames': [
            'BillingBucketSizeHour',
            'BillingBucketSizeDay',
            'BillingBucketSizeWeek',
            'BillingBucketSizeMonth',
            'BillingBucketSizeYear',
          ],
          default: 'day',
          examples: ['day'],
        },
      },
    },
  },
  {
    name: 'pod-action',
    operationId: 'podAction',
    description:
      'Trigger a pod state transition. Triggers a state transition on a pod. Send a JSON body with a single `action` field, e.g. `{ "action": "stop" }`. Valid actions: - `start` — boot a stopped pod (`EXITED` or `ERROR`) back toward `RUNNING`. - `stop` — stop a running or provisioning pod, releasing GPU/CPU compute while keeping its disk. The pod moves to `EXITED`. - `restart` — restart a `RUNNING` pod\'s container in place. - `terminate` — permanently delete the pod and release its resources (equivalent to `deletePod`). Which actions are valid depends on the pod\'s current status, and the currently permitted set is published in the pod\'s `actions` field: `RUNNING` allows `stop`/`restart`/`terminate`; `EXITED` and `ERROR` allow `start`/`terminate`; `PROVISIONING` and `STARTING` allow `stop`/`terminate`. `start`, `stop`, and `restart` return `200` with the updated pod. `terminate` returns `204` with no body. Requesting an action that is not valid for the pod\'s current status returns `409`.',
    method: 'POST',
    path: '/v2/pods/{id}/action',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        body: {
          $ref: '#/$defs/PodActionRequest',
        },
      },
      required: ['id', 'body'],
      $defs: {
        PodAction: {
          type: 'string',
          enum: ['start', 'stop', 'restart', 'terminate'],
        },
        PodActionRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['action'],
          properties: {
            action: {
              $ref: '#/$defs/PodAction',
            },
          },
        },
      },
    },
  },
  {
    name: 'revoke-delegation',
    operationId: 'revokeDelegation',
    description: 'Revoke an ECR delegation',
    method: 'DELETE',
    path: '/v2/registries/delegations/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: false,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'update-cluster',
    operationId: 'updateCluster',
    description:
      'Rename a cluster. Renames a cluster. This endpoint only changes the cluster name — compute shape, type, and container configuration are fixed at creation and cannot be updated.',
    method: 'PATCH',
    path: '/v2/clusters/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        body: {
          $ref: '#/$defs/UpdateClusterRequest',
        },
      },
      required: ['id', 'body'],
      $defs: {
        UpdateClusterRequest: {
          type: 'object',
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              examples: ['renamed-cluster'],
            },
          },
        },
      },
    },
  },
  {
    name: 'update-endpoint',
    operationId: 'updateEndpoint',
    description:
      "Partially update a serverless endpoint (PATCH): only fields present in the body change, omitted ones are untouched, with one exception. DESTRUCTIVE GOTCHA: gpu.pools and gpu.excludedTypes are a single selection, so sending pools without excludedTypes clears any exclusions pinned elsewhere (the console or set-endpoint-gpus) — read the endpoint first with get-endpoint and resend excludedTypes if you still want them. An exclusion naming a type outside pools returns 400. A CUDA-only or count-only change does not need pools at all, so omit it unless you mean to replace the selection. Mutable fields: name, gpu, cpu, workers (min/max/idleTimeout), scaling (type plus queueDelay or requestCount), dataCenterIds, networkVolumes, timeout, flashboot, and the container settings (image, args, disk, ports, env, registry). cpu completely replaces a CPU endpoint's flavor selection. Compute family is immutable: gpu on a CPU endpoint, cpu on a GPU one, or both, returns 400. Effect timing differs by field — workers/scaling/timeout reach the autoscaler promptly, while container changes (image, env) cut a new release that rolls out as workers cycle, so in-flight workers keep the previous version. Track rollout with list-endpoint-releases.",
    method: 'PATCH',
    path: '/v2/serverless/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        body: {
          $ref: '#/$defs/UpdateEndpointRequest',
        },
      },
      required: ['id', 'body'],
      $defs: {
        BaseContainerConfig: {
          type: 'object',
          properties: {
            args: {
              type: 'string',
              examples: [
                '--model meta-llama/Llama-3-8B --max-model-len 8192',
                '{"entrypoint":["/bin/bash","-c"],"cmd":["python -u main.py"]}',
                '',
              ],
              description:
                'Container command as one string (treated as CMD), or {"entrypoint":[...],"cmd":[...]}.',
            },
            cmd: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [
                ['--model', 'meta-llama/Llama-3-8B', '--max-model-len', '8192'],
              ],
            },
            entrypoint: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['/bin/bash', '-c']],
            },
            disk: {
              type: 'integer',
              minimum: 1,
              examples: [50],
              description: 'Container disk in GB, wiped on restart.',
            },
            env: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              examples: [
                {
                  JUPYTER_PASSWORD: 'hunter2',
                },
              ],
            },
            image: {
              type: 'string',
              examples: ['runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404'],
            },
            ports: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['8888/http', '22/tcp']],
              description:
                'Exposed ports as port/protocol, e.g. 8888/http or 22/tcp.',
            },
          },
        },
        BaseCpuConfig: {
          type: 'object',
          required: ['id', 'vcpuCount'],
          properties: {
            id: {
              type: 'string',
              examples: ['cpu5c'],
              minLength: 1,
              description: 'CPU flavor id from list-cpu-types.',
            },
            vcpuCount: {
              type: 'integer',
              minimum: 2,
              examples: [4],
              description: 'Power of two, valid for the flavor.',
            },
          },
        },
        BaseEndpointGpuConfig: {
          type: 'object',
          properties: {
            pools: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'string',
              },
              examples: [['ADA_24']],
              description:
                'Serverless pool ids from list-gpu-types `pool` (e.g. ADA_24), not GPU type ids.',
            },
            excludedTypes: {
              type: 'array',
              uniqueItems: true,
              items: {
                type: 'string',
                pattern: '^\\s*[^-\\s]',
              },
              examples: [['NVIDIA L40']],
              description:
                'GPU type ids to subtract from pools. On update, sending pools without this clears it.',
            },
            count: {
              type: 'integer',
              minimum: 1,
              default: 1,
              examples: [1],
            },
          },
        },
        ContainerConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseContainerConfig',
            },
            {
              type: 'object',
              properties: {
                registry: {
                  type: ['string', 'null'],
                  examples: [null],
                  description:
                    'Registry credential id for a private image (list-registries).',
                },
              },
            },
          ],
        },
        CreateCpuConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseCpuConfig',
            },
          ],
          unevaluatedProperties: false,
        },
        EndpointScaling: {
          oneOf: [
            {
              $ref: '#/$defs/QueueDelayScaling',
            },
            {
              $ref: '#/$defs/RequestCountScaling',
            },
          ],
          discriminator: {
            propertyName: 'type',
            mapping: {
              QUEUE_DELAY: '#/$defs/QueueDelayScaling',
              REQUEST_COUNT: '#/$defs/RequestCountScaling',
            },
          },
          description:
            'QUEUE_DELAY (QUEUE endpoints only) or REQUEST_COUNT (required for LOAD_BALANCER).',
        },
        EndpointWorkers: {
          type: 'object',
          additionalProperties: false,
          properties: {
            min: {
              type: 'integer',
              minimum: 0,
              examples: [0],
            },
            max: {
              type: 'integer',
              minimum: 0,
              examples: [5],
            },
            idleTimeout: {
              type: 'integer',
              minimum: 1,
              maximum: 3600,
              examples: [5],
              description:
                'Seconds before idle workers scale down. Rejected for a QUEUE endpoint scaling on REQUEST_COUNT.',
            },
          },
        },
        FlashBoot: {
          type: 'string',
          enum: ['OFF', 'FLASHBOOT', 'PRIORITY_FLASHBOOT'],
        },
        QueueDelayScaling: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'queueDelay'],
          properties: {
            type: {
              type: 'string',
              enum: ['QUEUE_DELAY'],
            },
            queueDelay: {
              type: 'number',
              format: 'float',
              minimum: 0.5,
              examples: [4],
            },
          },
        },
        RequestCountScaling: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'requestCount'],
          properties: {
            type: {
              type: 'string',
              enum: ['REQUEST_COUNT'],
            },
            requestCount: {
              type: 'integer',
              minimum: 1,
              examples: [4],
            },
          },
        },
        UpdateEndpointGpuConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseEndpointGpuConfig',
            },
            {
              type: 'object',
              dependentRequired: {
                excludedTypes: ['pools'],
              },
              properties: {
                allowedCudaVersions: {
                  type: 'array',
                  items: {
                    type: 'string',
                    pattern: '^\\d+\\.\\d+$',
                  },
                  description:
                    'Exact CUDA versions as major.minor; [] clears. Exclusive with minCudaVersion.',
                },
                minCudaVersion: {
                  type: 'string',
                  pattern: '^$|^\\d+\\.\\d+$',
                  examples: ['12.1'],
                  description:
                    'CUDA floor as major.minor; "" clears. Exclusive with allowedCudaVersions.',
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
        UpdateEndpointRequest: {
          allOf: [
            {
              $ref: '#/$defs/ContainerConfig',
            },
            {
              type: 'object',
              properties: {
                cpu: {
                  type: 'array',
                  minItems: 1,
                  uniqueItems: true,
                  items: {
                    $ref: '#/$defs/CreateCpuConfig',
                  },
                },
                dataCenterIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                flashboot: {
                  $ref: '#/$defs/FlashBoot',
                },
                gpu: {
                  $ref: '#/$defs/UpdateEndpointGpuConfig',
                },
                name: {
                  type: 'string',
                  minLength: 1,
                },
                networkVolumes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                scaling: {
                  $ref: '#/$defs/EndpointScaling',
                },
                templateId: {
                  type: 'string',
                  examples: ['30zmvf89kd'],
                  description:
                    "Applies a template's container settings once; the merged env replaces the current env.",
                },
                timeout: {
                  type: 'integer',
                },
                workers: {
                  $ref: '#/$defs/EndpointWorkers',
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
      },
    },
  },
  {
    name: 'update-network-volume',
    operationId: 'updateNetworkVolume',
    description:
      'Update a network volume. Updates mutable fields on a network volume. Only provided fields are changed. Note: `size` may only increase; attempts to reduce size will be rejected.',
    method: 'PATCH',
    path: '/v2/network-volumes/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        body: {
          $ref: '#/$defs/UpdateNetworkVolumeRequest',
        },
      },
      required: ['id', 'body'],
      $defs: {
        UpdateNetworkVolumeRequest: {
          type: 'object',
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              examples: ['renamed-volume'],
            },
            size: {
              type: 'integer',
              minimum: 10,
              maximum: 4096,
              examples: [100],
              description: 'GB; cannot be reduced.',
            },
          },
        },
      },
    },
  },
  {
    name: 'update-pod',
    operationId: 'updatePod',
    description:
      "Update a pod. Partially updates a pod's configuration. This is a PATCH: only the fields present in the body are changed, and omitted fields are left untouched. Use empty values only when you explicitly mean to clear a field (for example, set `registry` to `null` or set `ports` to `[]`). See `UpdatePodRequest` for the full body. Mutable fields: `name`, `image`, `args`, `disk`, `ports`, `env`, `registry`, `mounts`, `locked`, and `globalNetworking`. Some changes apply immediately while others (e.g. `globalNetworking`) take effect on the pod's next start/restart, as noted on the individual fields. Pods that belong to a Cluster cannot be updated here — manage them through `/v2/clusters/{id}`. Returns `200` with the full updated pod.",
    method: 'PATCH',
    path: '/v2/pods/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        body: {
          $ref: '#/$defs/UpdatePodRequest',
        },
      },
      required: ['id', 'body'],
      $defs: {
        BaseContainerConfig: {
          type: 'object',
          properties: {
            args: {
              type: 'string',
              examples: [
                '--model meta-llama/Llama-3-8B --max-model-len 8192',
                '{"entrypoint":["/bin/bash","-c"],"cmd":["python -u main.py"]}',
                '',
              ],
              description:
                'Container command as one string (treated as CMD), or {"entrypoint":[...],"cmd":[...]}.',
            },
            cmd: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [
                ['--model', 'meta-llama/Llama-3-8B', '--max-model-len', '8192'],
              ],
            },
            entrypoint: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['/bin/bash', '-c']],
            },
            disk: {
              type: 'integer',
              minimum: 1,
              examples: [50],
              description: 'Container disk in GB, wiped on restart.',
            },
            env: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              examples: [
                {
                  JUPYTER_PASSWORD: 'hunter2',
                },
              ],
            },
            image: {
              type: 'string',
              examples: ['runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404'],
            },
            ports: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['8888/http', '22/tcp']],
              description:
                'Exposed ports as port/protocol, e.g. 8888/http or 22/tcp.',
            },
          },
        },
        ContainerConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseContainerConfig',
            },
            {
              type: 'object',
              properties: {
                registry: {
                  type: ['string', 'null'],
                  examples: [null],
                  description:
                    'Registry credential id for a private image (list-registries).',
                },
              },
            },
          ],
        },
        Mounts: {
          type: 'object',
          additionalProperties: false,
          properties: {
            persistent: {
              $ref: '#/$defs/PersistentMount',
            },
            network: {
              type: 'array',
              maxItems: 1,
              items: {
                $ref: '#/$defs/NetworkMount',
              },
            },
          },
          description: 'At most one of persistent or network.',
        },
        NetworkMount: {
          type: 'object',
          required: ['volumeId', 'path'],
          additionalProperties: false,
          properties: {
            volumeId: {
              type: 'string',
              examples: ['vol_xyz'],
              description:
                "Network volume id; must be in the pod's data center.",
            },
            path: {
              type: 'string',
              examples: ['/runpod-volume'],
            },
          },
        },
        PersistentMount: {
          type: 'object',
          required: ['size', 'path'],
          additionalProperties: false,
          properties: {
            size: {
              type: 'integer',
              minimum: 10,
              examples: [20],
              description: 'GB, minimum 10.',
            },
            path: {
              type: 'string',
              examples: ['/workspace'],
            },
          },
          description:
            'Host-local storage, lost on host failure. Not allowed on CPU pods.',
        },
        UpdatePodRequest: {
          allOf: [
            {
              $ref: '#/$defs/ContainerConfig',
            },
            {
              type: 'object',
              properties: {
                globalNetworking: {
                  type: 'boolean',
                  description: 'Takes effect on the next start, not live.',
                },
                locked: {
                  type: 'boolean',
                  description: 'Locked pods cannot be stopped or reset.',
                },
                mounts: {
                  $ref: '#/$defs/Mounts',
                },
                name: {
                  type: 'string',
                  minLength: 1,
                },
                templateId: {
                  type: 'string',
                  examples: ['30zmvf89kd'],
                  description:
                    "Applies a template's container settings once; the merged env replaces the current env.",
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
      },
    },
  },
  {
    name: 'update-secret',
    operationId: 'updateSecret',
    description:
      "Update a secret. Rotates a secret's value and/or updates its description. Only the provided fields are changed and at least one field is required; the `name` is immutable. Pods and workers receive the new value at their next boot — running instances keep the value they were started with. When both fields are sent, the value is applied first, then the description. The two updates are not atomic: if the description update fails after the value was rotated, the response is an error but the new value has already taken effect. Send the fields in separate requests when that partial outcome matters.",
    method: 'PATCH',
    path: '/v2/account/secrets/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        body: {
          $ref: '#/$defs/UpdateSecretRequest',
        },
      },
      required: ['id', 'body'],
      $defs: {
        UpdateSecretRequest: {
          type: 'object',
          additionalProperties: false,
          minProperties: 1,
          properties: {
            value: {
              type: 'string',
              minLength: 1,
              maxLength: 16777216,
            },
            description: {
              type: 'string',
              maxLength: 65535,
            },
          },
        },
      },
    },
  },
  {
    name: 'update-ssh-keys',
    operationId: 'updateSshKeys',
    description:
      "Replace registered SSH public keys. Replaces the account's full set of registered SSH public keys. Existing keys not present in the request are removed; send `[]` to remove all keys. Keys take effect for pods created afterwards with `startSsh` — running pods are not updated.",
    method: 'PUT',
    path: '/v2/account/ssh-keys',
    params: [],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        body: {
          $ref: '#/$defs/UpdateSshKeysRequest',
        },
      },
      required: ['body'],
      $defs: {
        UpdateSshKeysRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['keys'],
          properties: {
            keys: {
              type: 'array',
              items: {
                type: 'string',
                pattern: '^(ssh|ecdsa|sk)-[^\\s]+ [^\\s]+([ \\t][^\\n\\r]*)?$',
              },
              examples: [
                [
                  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILXGDN/SclOozk1xsDztpmhGiKkkrfQB9SKoO8dSIQQZ me@example.com',
                ],
              ],
              description:
                'The complete key set, replacing all registered keys; [] removes them all. Each entry is an authorized_keys line.',
            },
          },
        },
      },
    },
  },
  {
    name: 'update-template',
    operationId: 'updateTemplate',
    description:
      "Update a template. Partially updates a template. This is a PATCH: only the fields present in the body are changed; omitted fields are left untouched. See `UpdateTemplateRequest` for the full body. Mutable fields: `name`, `image`, `args`, `disk`, `ports`, `env`, `registry`, `mounts`, `serverless`, `public`, and `category`. Only the template's owner can update it (authenticated via the request's API key); public catalog templates are readable via GET but return `404` here. Returns `200` with the full updated template. Pods and endpoints already created from this template are not changed retroactively — the template is a snapshot applied at creation time.",
    method: 'PATCH',
    path: '/v2/templates/{id}',
    params: [
      {
        name: 'id',
        location: 'path',
      },
    ],
    hasBody: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        body: {
          $ref: '#/$defs/UpdateTemplateRequest',
        },
      },
      required: ['id', 'body'],
      $defs: {
        BaseContainerConfig: {
          type: 'object',
          properties: {
            args: {
              type: 'string',
              examples: [
                '--model meta-llama/Llama-3-8B --max-model-len 8192',
                '{"entrypoint":["/bin/bash","-c"],"cmd":["python -u main.py"]}',
                '',
              ],
              description:
                'Container command as one string (treated as CMD), or {"entrypoint":[...],"cmd":[...]}.',
            },
            cmd: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [
                ['--model', 'meta-llama/Llama-3-8B', '--max-model-len', '8192'],
              ],
            },
            entrypoint: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['/bin/bash', '-c']],
            },
            disk: {
              type: 'integer',
              minimum: 1,
              examples: [50],
              description: 'Container disk in GB, wiped on restart.',
            },
            env: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
              examples: [
                {
                  JUPYTER_PASSWORD: 'hunter2',
                },
              ],
            },
            image: {
              type: 'string',
              examples: ['runpod/pytorch:1.0.2-cu1281-torch280-ubuntu2404'],
            },
            ports: {
              type: 'array',
              items: {
                type: 'string',
              },
              examples: [['8888/http', '22/tcp']],
              description:
                'Exposed ports as port/protocol, e.g. 8888/http or 22/tcp.',
            },
          },
        },
        ContainerConfig: {
          allOf: [
            {
              $ref: '#/$defs/BaseContainerConfig',
            },
            {
              type: 'object',
              properties: {
                registry: {
                  type: ['string', 'null'],
                  examples: [null],
                  description:
                    'Registry credential id for a private image (list-registries).',
                },
              },
            },
          ],
        },
        PersistentMount: {
          type: 'object',
          required: ['size', 'path'],
          additionalProperties: false,
          properties: {
            size: {
              type: 'integer',
              minimum: 10,
              examples: [20],
              description: 'GB, minimum 10.',
            },
            path: {
              type: 'string',
              examples: ['/workspace'],
            },
          },
          description:
            'Host-local storage, lost on host failure. Not allowed on CPU pods.',
        },
        TemplateCategory: {
          type: 'string',
          enum: ['CPU', 'NVIDIA', 'AMD'],
        },
        TemplateMounts: {
          type: 'object',
          additionalProperties: false,
          properties: {
            persistent: {
              $ref: '#/$defs/PersistentMount',
            },
          },
          description: 'Persistent only; network is rejected.',
        },
        UpdateTemplateRequest: {
          allOf: [
            {
              $ref: '#/$defs/ContainerConfig',
            },
            {
              type: 'object',
              properties: {
                allowedCudaVersions: {
                  type: 'array',
                  items: {
                    type: 'string',
                    pattern: '^\\d+\\.\\d+$',
                  },
                  description: 'Exact CUDA versions as major.minor; [] clears.',
                },
                category: {
                  $ref: '#/$defs/TemplateCategory',
                },
                mounts: {
                  $ref: '#/$defs/TemplateMounts',
                },
                name: {
                  type: 'string',
                  minLength: 1,
                },
                public: {
                  type: 'boolean',
                },
                serverless: {
                  type: 'boolean',
                },
                startJupyter: {
                  type: 'boolean',
                },
                startSsh: {
                  type: 'boolean',
                },
              },
            },
          ],
          unevaluatedProperties: false,
        },
      },
    },
  },
];
