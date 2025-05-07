

REBUILD=false
if [[ "$1" == "--rebuild" ]]; then
    REBUILD=true
fi

CONTAINER_NAME="flexatar-demo"
IMAGE_NAME="flexatar-demo"
IMAGE_TAG="latest"  # Change this if needed
# ENV_FILE="./flexatar-demo.env" 

echo "rebuild ${REBUILD}"
# Check if the image exists
if $REBUILD || ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${IMAGE_NAME}:${IMAGE_TAG}$"; then
    echo "Image ${IMAGE_NAME}:${IMAGE_TAG} not found. Building..."
    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    
else
   echo "Image ${IMAGE_NAME}:${IMAGE_TAG} already exists."
fi

if docker ps -a --filter "name=^${CONTAINER_NAME}$" --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping running container: ${CONTAINER_NAME}... Starting new."
    docker stop "${CONTAINER_NAME}"
    docker rm ${CONTAINER_NAME}
else
    echo "Container ${CONTAINER_NAME} is not running. Starting new"
fi

docker run \
    --env-file .env --name ${CONTAINER_NAME} -d -p 8081:8081 ${IMAGE_NAME}:${IMAGE_TAG}
    
    